import { Env } from '../types';

interface QueryParams {
  sql: string;
  params?: any[];
}

interface AuditLog {
  userId?: string;
  eventType: string;
  resourceType?: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  outcome: string;
}

export interface RequestContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class DatabaseService {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  /**
   * Execute a query that returns a single row or null
   */
  async queryOne<T>(query: QueryParams): Promise<T | null> {
    const { sql, params = [] } = query;
    const stmt = this.db.prepare(sql);
    const boundStmt = this.bindParams(stmt, params);
    const result = await boundStmt.first();
    return result as T | null;
  }

  /**
   * Execute a query that returns multiple rows
   */
  async queryMany<T>(query: QueryParams): Promise<T[]> {
    const { sql, params = [] } = query;
    const stmt = this.db.prepare(sql);
    const boundStmt = this.bindParams(stmt, params);
    const result = await boundStmt.all();
    return result.results as T[];
  }

  /**
   * Execute a query that doesn't return any data (INSERT, UPDATE, DELETE)
   */
  async execute(query: QueryParams): Promise<D1Result> {
    const { sql, params = [] } = query;
    const stmt = this.db.prepare(sql);
    const boundStmt = this.bindParams(stmt, params);
    return await boundStmt.run();
  }

  /**
   * Execute a query with audit logging
   */
  async executeWithAudit(
    query: QueryParams,
    auditInfo: {
      eventType: string;
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      details?: string;
      outcome: string;
    },
    context?: RequestContext
  ): Promise<D1Result> {
    const result = await this.execute(query);

    // Log the action to the audit log table
    await this.logAudit({
      ...auditInfo,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return result;
  }

  /**
   * Begin a database transaction
   */
  async transaction<T>(callback: (tx: DatabaseService) => Promise<T>): Promise<T> {
    try {
      await this.execute({ sql: 'BEGIN TRANSACTION' });
      const result = await callback(this);
      await this.execute({ sql: 'COMMIT' });
      return result;
    } catch (error) {
      await this.execute({ sql: 'ROLLBACK' });
      throw error;
    }
  }

  /**
   * Get the raw D1Database instance
   * For complex queries or migrations where the abstraction is insufficient
   */
  getRawDatabase(): D1Database {
    return this.db;
  }

  /**
   * Log an action to the audit log
   */
  private async logAudit(auditLog: AuditLog): Promise<void> {
    const {
      userId,
      eventType,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      sessionId,
      timestamp,
      createdAt,
      updatedAt,
      outcome,
    } = auditLog;

    await this.execute({
      sql: `
        INSERT INTO AuditLog (
          userId, eventType, resourceType, resourceId, 
          details, ipAddress, userAgent, sessionId,
          timestamp, createdAt, updatedAt, outcome
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        userId || null,
        eventType,
        resourceType || null,
        resourceId || null,
        details || null,
        ipAddress || null,
        userAgent || null,
        sessionId || null,
        timestamp,
        createdAt,
        updatedAt,
        outcome,
      ],
    });
  }

  /**
   * Helper method to bind parameters to a statement
   */
  private bindParams(stmt: D1PreparedStatement, params: any[]): D1PreparedStatement {
    if (params.length === 0) {
      return stmt;
    }
    return stmt.bind(...params);
  }
}
