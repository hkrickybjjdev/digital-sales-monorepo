import { DEFAULT_RETRY_CONFIG, RetryConfig, isRetryableKVError, withRetry } from '../utils/utils';

/**
 * Interface for key-value storage operations
 * Used by repositories to abstract storage implementation details
 */
export interface KeyValueStore {
  /**
   * Retrieves a value by key
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value with the given key
   * @param key The key to store the value under
   * @param value The value to store
   */
  put<T>(key: string, value: T): Promise<boolean>;

  /**
   * Removes a value by key
   * @param key The key to remove
   */
  delete(key: string): Promise<boolean>;

  /**
   * Lists all keys with a given prefix
   * @param prefix The prefix to filter keys by
   * @returns Array of matching keys
   */
  list(prefix: string): Promise<string[]>;
}

/**
 * Cloudflare KV implementation of the KeyValueStore interface
 */
export class CloudflareKVStore implements KeyValueStore {
  private namespace: KVNamespace;
  private retryConfig: RetryConfig;

  constructor(namespace: KVNamespace, retryConfig?: RetryConfig) {
    this.namespace = namespace;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async get<T>(key: string, retryOptions?: RetryConfig): Promise<T | null> {
    try {
      return await withRetry(
        async () => {
          const value = await this.namespace.get(key, 'json');
          return value as T | null;
        },
        isRetryableKVError,
        { ...this.retryConfig, ...retryOptions }
      );
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async put<T>(key: string, value: T, retryOptions?: RetryConfig): Promise<boolean> {
    try {
      await withRetry(
        async () => {
          await this.namespace.put(key, JSON.stringify(value));
        },
        isRetryableKVError,
        { ...this.retryConfig, ...retryOptions }
      );
      return true;
    } catch (error) {
      console.error(`Error putting key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string, retryOptions?: RetryConfig): Promise<boolean> {
    try {
      await withRetry(
        async () => {
          await this.namespace.delete(key);
        },
        isRetryableKVError,
        { ...this.retryConfig, ...retryOptions }
      );
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async list(prefix: string, retryOptions?: RetryConfig): Promise<string[]> {
    try {
      return (
        (await withRetry(
          async () => {
            const { keys } = await this.namespace.list({ prefix });
            return keys.map(k => k.name);
          },
          isRetryableKVError,
          { ...this.retryConfig, ...retryOptions }
        )) || []
      );
    } catch (error) {
      console.error(`Error listing keys with prefix ${prefix}:`, error);
      return [];
    }
  }
}
