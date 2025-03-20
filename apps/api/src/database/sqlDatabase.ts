import { RetryConfig } from '../utils/utils';

export interface QueryParams {
  sql: string;
  params?: any[];
}

export interface AuditInfo {
  eventType: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: string;
  outcome: string;
}

export interface RequestContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Interface for common SQL database operations
 * This provides an abstraction layer that can be implemented
 * for different SQL database providers (D1, SQLite, MySQL, PostgreSQL, etc.)
 */
export interface SQLDatabase {
  /**
   * Execute a query that returns a single row or null
   */
  queryOne<T>(query: QueryParams): Promise<T | null>;

  /**
   * Execute a query that returns multiple rows
   */
  queryMany<T>(query: QueryParams): Promise<T[]>;

  /**
   * Execute a query that doesn't return any data (INSERT, UPDATE, DELETE)
   */
  execute(query: QueryParams, retryOptions?: RetryConfig): Promise<unknown>;

  /**
   * Execute a query with audit logging
   */
  executeWithAudit(
    query: QueryParams,
    auditInfo: AuditInfo,
    context?: RequestContext
  ): Promise<unknown>;

  /**
   * Create an audit log entry without executing a database operation
   */
  createAuditLog(auditInfo: AuditInfo, context?: RequestContext): Promise<boolean>;

  /**
   * Begin a database transaction
   */
  transaction<T>(callback: (tx: SQLDatabase) => Promise<T>): Promise<T>;

  /**
   * Get the raw database instance
   * For complex queries or migrations where the abstraction is insufficient
   */
  getRawDatabase(): unknown;
}
