import { Env } from '../types';
import { DatabaseService } from './databaseService';

/**
 * Factory class to manage the DatabaseService instance
 */
export class DatabaseFactory {
  private static instance: DatabaseService | null = null;

  /**
   * Get the DatabaseService singleton instance
   * Creates a new instance if one does not exist
   */
  static getInstance(env: Env): DatabaseService {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseService(env);
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
} 