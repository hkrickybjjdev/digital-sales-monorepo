import { Env } from '../types';

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

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

// Interface for retry configuration
export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
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
   * Now with retry capability and exponential backoff
   */
  async execute(query: QueryParams, retryOptions?: RetryConfig): Promise<D1Result> {
    const config = { ...this.retryConfig, ...retryOptions };
    let lastError: Error | null = null;
    let delayMs = config.initialDelayMs!;

    for (let attempt = 1; attempt <= config.maxAttempts!; attempt++) {
      try {
        const { sql, params = [] } = query;
        const stmt = this.db.prepare(sql);
        const boundStmt = this.bindParams(stmt, params);
        return await boundStmt.run();
      } catch (error) {
        lastError = error as Error;

        // If this is the last attempt, or the error is not retryable, throw it
        if (attempt >= config.maxAttempts! || !this.isRetryableError(error)) {
          throw error;
        }

        // Wait before the next retry with exponential backoff
        await this.delay(delayMs);

        // Increase delay for next attempt with exponential backoff
        delayMs = Math.min(delayMs * config.backoffFactor!, config.maxDelayMs!);
      }
    }

    // This should never be reached, but TypeScript requires a return statement
    throw lastError;
  }

  /**
   * Execute a query with audit logging
   */
  async executeWithAudit(
    query: QueryParams,
    auditInfo: AuditInfo,
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
   * Create an audit log entry without executing a database operation
   * This is useful for logging events that don't modify the database
   */
  async createAuditLog(auditInfo: AuditInfo, context?: RequestContext): Promise<void> {
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

  /**
   * Helper method to determine if an error is retryable
   * Override this method to customize which errors should be retried
   */
  protected isRetryableError(error: any): boolean {
    // Common transient errors that should be retried
    // Examples: connection issues, deadlocks, etc.
    const retryableErrors = [
      'database is locked',
      'busy',
      'connection',
      'timeout',
      'network',
      'SQLITE_BUSY',
      'SQLITE_LOCKED',
    ];

    if (error && error.message) {
      return retryableErrors.some(retryErr =>
        error.message.toLowerCase().includes(retryErr.toLowerCase())
      );
    }

    return false;
  }

  /**
   * Helper method to wait for the specified delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * For backwards compatibility, maintaining the DatabaseService class
 * that extends the CloudflareD1Database implementation
 */
export class DatabaseService extends CloudflareD1Database {
  constructor(env: Env, retryConfig?: RetryConfig) {
    super(env.DB, retryConfig);
  }
}
