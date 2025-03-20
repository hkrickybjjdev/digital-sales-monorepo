import { RetryConfig } from '@/utils/utils';
import { Env } from '../types';

import { CloudflareD1Database } from './cloudflareD1Database';
import { SQLDatabase } from './sqlDatabase';

/**
 * Default implementation function for creating a database instance
 */
const databaseImplementation = (env: Env, config?: RetryConfig): SQLDatabase =>
  new CloudflareD1Database(env.DB, config);

/**
 * Creates a SQLDatabase instance using the configured implementation
 */
export function createDatabase(env: Env, config?: RetryConfig): SQLDatabase {
  return databaseImplementation(env, config);
}
