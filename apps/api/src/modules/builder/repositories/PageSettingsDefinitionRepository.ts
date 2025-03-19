import { KeyValueStore } from '../../../database/kvStore';
import { PageSettingsDefinition, pageSettingsDefinitionSchema } from '../models/schemas';

/**
 * Repository class for managing PageSettingsDefinition entities in KV storage
 */
export class PageSettingsDefinitionRepository {
  private readonly keyPrefix = 'pageSettingDefinition:';
  private kvStore: KeyValueStore;

  constructor(kvStore: KeyValueStore) {
    this.kvStore = kvStore;
  }

  /**
   * Generates a storage key for a page settings definition
   * @param name Settings name identifier
   * @returns Full key with prefix
   */
  private getKey(name: string): string {
    return `${this.keyPrefix}${name}`;
  }

  /**
   * Retrieves all page settings definitions
   * @returns Array of page settings definitions
   */
  async getAll(): Promise<PageSettingsDefinition[]> {
    try {
      const keys = await this.kvStore.list(this.keyPrefix);
      const definitions: PageSettingsDefinition[] = [];

      for (const key of keys) {
        const definition = await this.kvStore.get<PageSettingsDefinition>(key);
        if (definition) {
          // Validate against schema to ensure data integrity
          const validatedDefinition = pageSettingsDefinitionSchema.parse(definition);
          definitions.push(validatedDefinition);
        }
      }

      return definitions;
    } catch (error) {
      console.error('Error fetching page settings definitions:', error);
      throw new Error('Failed to retrieve page settings definitions');
    }
  }

  /**
   * Retrieves a page settings definition by its name
   * @param name The setting name identifier
   * @returns The settings definition or null if not found
   */
  async getByName(name: string): Promise<PageSettingsDefinition | null> {
    try {
      const key = this.getKey(name);
      const definition = await this.kvStore.get<PageSettingsDefinition>(key);

      if (!definition) return null;

      // Validate against schema to ensure data integrity
      return pageSettingsDefinitionSchema.parse(definition);
    } catch (error) {
      console.error(`Error fetching page settings definition with name ${name}:`, error);
      throw new Error(`Failed to retrieve page settings definition with name ${name}`);
    }
  }

  /**
   * Saves a page settings definition to KV storage
   * @param definition The settings definition to save
   */
  async save(definition: PageSettingsDefinition): Promise<void> {
    try {
      // Validate against schema before saving
      const validatedDefinition = pageSettingsDefinitionSchema.parse(definition);
      const key = this.getKey(validatedDefinition.settingName);
      await this.kvStore.put(key, validatedDefinition);
    } catch (error) {
      console.error('Error saving page settings definition:', error);
      throw new Error('Failed to save page settings definition');
    }
  }

  /**
   * Deletes a page settings definition by its name
   * @param name The setting name identifier
   */
  async delete(name: string): Promise<void> {
    try {
      const key = this.getKey(name);
      await this.kvStore.delete(key);
    } catch (error) {
      console.error(`Error deleting page settings definition with name ${name}:`, error);
      throw new Error(`Failed to delete page settings definition with name ${name}`);
    }
  }
}
