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
  put<T>(key: string, value: T): Promise<void>;

  /**
   * Removes a value by key
   * @param key The key to remove
   */
  delete(key: string): Promise<void>;

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

  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.namespace.get(key, 'json');
    return value as T | null;
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.namespace.put(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.namespace.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const { keys } = await this.namespace.list({ prefix });
    return keys.map(k => k.name);
  }
}
