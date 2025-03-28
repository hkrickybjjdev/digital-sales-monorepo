import { RequestContext, SQLDatabase } from '../../database/sqlDatabase';

/**
 * Interface for audit logging operations
 */
export interface IAuditHelpers {
  logSuccess(
    eventType: string,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details?: Record<string, any>,
    context?: RequestContext
  ): Promise<void>;

  logFailure(
    eventType: string,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details?: Record<string, any>,
    context?: RequestContext
  ): Promise<void>;

  logAccessControl(
    granted: boolean,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details?: Record<string, any>,
    context?: RequestContext
  ): Promise<void>;

  logError(
    eventType: string,
    error: Error | string,
    resourceType?: string,
    resourceId?: string,
    userId?: string,
    context?: RequestContext
  ): Promise<void>;

  logDataChange(
    operation: 'created' | 'updated' | 'deleted',
    resourceType: string,
    resourceId?: string,
    userId?: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    context?: RequestContext
  ): Promise<void>;
}

/**
 * Helper functions for consistent audit logging across repositories
 * These can be imported and used by various repositories to ensure
 * consistent audit log patterns
 */
export class AuditHelpers implements IAuditHelpers {
  private dbService: SQLDatabase;

  constructor(dbService: SQLDatabase) {
    this.dbService = dbService;
  }

  /**
   * Log a successful operation
   */
  async logSuccess(
    eventType: string,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details: Record<string, any> = {},
    context?: RequestContext
  ): Promise<void> {
    await this.dbService.createAuditLog(
      {
        eventType,
        userId,
        resourceType,
        resourceId,
        details: JSON.stringify(details),
        outcome: 'success',
      },
      context
    );
  }

  /**
   * Log a failed operation
   */
  async logFailure(
    eventType: string,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details: Record<string, any> = {},
    context?: RequestContext
  ): Promise<void> {
    await this.dbService.createAuditLog(
      {
        eventType,
        userId,
        resourceType,
        resourceId,
        details: JSON.stringify(details),
        outcome: 'failure',
      },
      context
    );
  }

  /**
   * Log access control events (like permission checks)
   */
  async logAccessControl(
    granted: boolean,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    details: Record<string, any> = {},
    context?: RequestContext
  ): Promise<void> {
    await this.dbService.createAuditLog(
      {
        eventType: granted ? 'access_granted' : 'access_denied',
        userId,
        resourceType,
        resourceId,
        details: JSON.stringify(details),
        outcome: granted ? 'success' : 'failure',
      },
      context
    );
  }

  /**
   * Log a system error
   */
  async logError(
    eventType: string,
    error: Error | string,
    resourceType: string = 'System',
    resourceId?: string,
    userId?: string,
    context?: RequestContext
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.dbService.createAuditLog(
      {
        eventType,
        userId,
        resourceType,
        resourceId,
        details: JSON.stringify({
          message: errorMessage,
          stack: errorStack,
        }),
        outcome: 'failure',
      },
      context
    );
  }

  /**
   * Log data changes (create/update/delete operations)
   */
  async logDataChange(
    operation: 'created' | 'updated' | 'deleted',
    resourceType: string,
    resourceId?: string,
    userId?: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    context?: RequestContext
  ): Promise<void> {
    await this.dbService.createAuditLog(
      {
        eventType: `${resourceType.toLowerCase()}_${operation}`,
        userId,
        resourceType,
        resourceId,
        details: JSON.stringify({
          before,
          after,
          changedFields: this.getChangedFields(before, after),
        }),
        outcome: 'success',
      },
      context
    );
  }

  /**
   * Helper to identify which fields changed between before and after
   */
  private getChangedFields(before?: Record<string, any>, after?: Record<string, any>): string[] {
    if (!before || !after) return [];

    const changedFields: string[] = [];

    // Find all fields that changed
    for (const key in after) {
      if (before[key] !== after[key]) {
        changedFields.push(key);
      }
    }

    // Find fields that were removed
    for (const key in before) {
      if (!(key in after)) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }
}

/**
 * Factory function to create an AuditHelpers instance
 */
export const createAuditHelpers = (dbService: SQLDatabase): IAuditHelpers => {
  return new AuditHelpers(dbService);
};
