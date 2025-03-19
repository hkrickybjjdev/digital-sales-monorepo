import { KeyValueStore } from '../../../database/kvStore';
import { PredefinedContentBlock, predefinedContentBlockSchema } from '../models/schemas';

/**
 * Repository class for managing PredefinedContentBlock entities in KV storage
 */
export class PredefinedContentBlockRepository {
  private readonly keyPrefix = 'predefinedBlock:';
  private kvStore: KeyValueStore;

  constructor(kvStore: KeyValueStore) {
    this.kvStore = kvStore;
  }

  /**
   * Generates a storage key for a predefined content block
   * @param type Block type identifier
   * @returns Full key with prefix
   */
  private getKey(type: string): string {
    return `${this.keyPrefix}${type}`;
  }

  /**
   * Retrieves all predefined content blocks
   * @returns Array of predefined content blocks
   */
  async getAll(): Promise<PredefinedContentBlock[]> {
    try {
      const keys = await this.kvStore.list(this.keyPrefix);
      const blocks: PredefinedContentBlock[] = [];

      for (const key of keys) {
        const block = await this.kvStore.get<PredefinedContentBlock>(key);
        if (block) {
          // Validate against schema to ensure data integrity
          const validatedBlock = predefinedContentBlockSchema.parse(block);
          blocks.push(validatedBlock);
        }
      }

      return blocks;
    } catch (error) {
      console.error('Error fetching predefined content blocks:', error);
      throw new Error('Failed to retrieve predefined content blocks');
    }
  }

  /**
   * Retrieves a predefined content block by its type
   * @param type The block type identifier
   * @returns The content block or null if not found
   */
  async getByType(type: string): Promise<PredefinedContentBlock | null> {
    try {
      const key = this.getKey(type);
      const block = await this.kvStore.get<PredefinedContentBlock>(key);

      if (!block) return null;

      // Validate against schema to ensure data integrity
      return predefinedContentBlockSchema.parse(block);
    } catch (error) {
      console.error(`Error fetching predefined content block with type ${type}:`, error);
      throw new Error(`Failed to retrieve predefined content block with type ${type}`);
    }
  }

  /**
   * Saves a predefined content block to KV storage
   * @param block The block to save
   */
  async save(block: PredefinedContentBlock): Promise<void> {
    try {
      // Validate against schema before saving
      const validatedBlock = predefinedContentBlockSchema.parse(block);
      const key = this.getKey(validatedBlock.type);
      await this.kvStore.put(key, validatedBlock);
    } catch (error) {
      console.error('Error saving predefined content block:', error);
      throw new Error('Failed to save predefined content block');
    }
  }

  /**
   * Deletes a predefined content block by its type
   * @param type The block type identifier
   */
  async delete(type: string): Promise<void> {
    try {
      const key = this.getKey(type);
      await this.kvStore.delete(key);
    } catch (error) {
      console.error(`Error deleting predefined content block with type ${type}:`, error);
      throw new Error(`Failed to delete predefined content block with type ${type}`);
    }
  }
}
