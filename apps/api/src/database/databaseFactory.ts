import { Env } from '../types';

import { CloudflareD1Database, DatabaseService, RetryConfig } from './cloudflareD1Database';
import { SQLDatabase } from './sqlDatabase';

/**
 * Factory class for creating and managing SQLDatabase instances
 * Supports dependency injection for different database implementations
 */
export class DatabaseFactory {
  private static instance: SQLDatabase | null = null;
  private static implementation: (env: Env, config?: RetryConfig) => SQLDatabase = (env, config) =>
    new CloudflareD1Database(env.DB, config);

  /**
   * Get the SQLDatabase singleton instance
   * Creates a new instance if one does not exist
   */
  static getInstance(env: Env, config?: RetryConfig): SQLDatabase {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = DatabaseFactory.implementation(env, config);
    }
    return DatabaseFactory.instance;
  }

  /**
   * Reset the singleton instance
   * Useful for testing or when environment changes
   */
  static resetInstance(): void {
    DatabaseFactory.instance = null;
  }

  /**
   * Set the implementation to use for database access
   * This allows for dependency injection of different database implementations
   */
  static setImplementation(impl: (env: Env, config?: RetryConfig) => SQLDatabase): void {
    DatabaseFactory.implementation = impl;
    // Reset the instance so next getInstance call will use the new implementation
    DatabaseFactory.resetInstance();
  }

  /**
   * Create a new database instance without using the singleton pattern
   * Useful for creating isolated database connections or for testing
   */
  static createInstance(env: Env, config?: RetryConfig): SQLDatabase {
    return DatabaseFactory.implementation(env, config);
  }
}

/**
 * For backwards compatibility
 * Maintains the existing API to avoid breaking changes
 */
export { DatabaseService };
