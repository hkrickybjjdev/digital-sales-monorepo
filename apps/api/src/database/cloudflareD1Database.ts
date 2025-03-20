import { Env } from '../types';
import {
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  isRetryableDatabaseError,
  withRetry,
} from '../utils/utils';

import { AuditInfo, QueryParams, RequestContext, SQLDatabase } from './sqlDatabase';

// Audit log entry structure - extends the public AuditInfo interface with database-specific fields
interface AuditLog extends AuditInfo {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  // outcome is already in AuditInfo
}

/**
 * Cloudflare D1 implementation of the SQLDatabase interface
 */
export class CloudflareD1Database implements SQLDatabase {
  private db: D1Database;
  private retryConfig: RetryConfig;

  constructor(db: D1Database, retryConfig?: RetryConfig) {
    this.db = db;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Execute a query that returns a single row or null
   */
  async queryOne<T>(query: QueryParams, retryOptions?: RetryConfig): Promise<T | null> {
    try {
      return await withRetry(
        async () => {
          const { sql, params = [] } = query;
          const stmt = this.db.prepare(sql);
          const boundStmt = this.bindParams(stmt, params);
          const result = await boundStmt.first();
          return result as T | null;
        },
        isRetryableDatabaseError,
        { ...this.retryConfig, ...retryOptions }
      );
    } catch (error) {
      console.error('Error in queryOne:', error);
      return null;
    }
  }

  /**
   * Execute a query that returns multiple rows
   */
  async queryMany<T>(query: QueryParams, retryOptions?: RetryConfig): Promise<T[]> {
    try {
      return (
        (await withRetry(
          async () => {
            const { sql, params = [] } = query;
            const stmt = this.db.prepare(sql);
            const boundStmt = this.bindParams(stmt, params);
            const result = await boundStmt.all();
            return result.results as T[];
          },
          isRetryableDatabaseError,
          { ...this.retryConfig, ...retryOptions }
        )) || []
      );
    } catch (error) {
      console.error('Error in queryMany:', error);
      return [];
    }
  }

  /**
   * Execute a query that doesn't return any data (INSERT, UPDATE, DELETE)
   * Now with retry capability and exponential backoff
   */
  async execute(query: QueryParams, retryOptions?: RetryConfig): Promise<boolean> {
    try {
      await withRetry(
        async () => {
          const { sql, params = [] } = query;
          const stmt = this.db.prepare(sql);
          const boundStmt = this.bindParams(stmt, params);
          await boundStmt.run();
        },
        isRetryableDatabaseError,
        { ...this.retryConfig, ...retryOptions }
      );
      return true;
    } catch (error) {
      console.error('Error in execute:', error);
      return false;
    }
  }

  /**
   * Execute a query with audit logging
   */
  async executeWithAudit(
    query: QueryParams,
    auditInfo: AuditInfo,
    context?: RequestContext
  ): Promise<boolean> {
    const saved = await this.execute(query);

    if (saved) {
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
    }

    return saved;
  }

  /**
   * Create an audit log entry without executing a database operation
   * This is useful for logging events that don't modify the database
   */
  async createAuditLog(auditInfo: AuditInfo, context?: RequestContext): Promise<boolean> {
    return await this.logAudit({
      ...auditInfo,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      sessionId: context?.sessionId,
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Begin a database transaction
   */
  async transaction<T>(callback: (tx: SQLDatabase) => Promise<T>): Promise<T> {
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
  private async logAudit(auditLog: AuditLog): Promise<boolean> {
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

    return await this.execute({
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
