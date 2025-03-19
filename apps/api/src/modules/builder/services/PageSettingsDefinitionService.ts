import { PageSettingsDefinition } from '../models/schemas';
import { PageSettingsDefinitionRepository } from '../repositories/PageSettingsDefinitionRepository';

/**
 * Service class for business logic related to PageSettingsDefinition entities
 */
export class PageSettingsDefinitionService {
  private repository: PageSettingsDefinitionRepository;

  constructor(repository: PageSettingsDefinitionRepository) {
    this.repository = repository;
  }

  /**
   * Retrieves all page settings definitions
   * @returns Array of settings definitions
   */
  async getAll(): Promise<PageSettingsDefinition[]> {
    const definitions = await this.repository.getAll();
    // Sort by order property for consistent display order
    return definitions.sort((a, b) => a.order - b.order);
  }

  /**
   * Retrieves a page settings definition by its name
   * @param name Settings name identifier
   * @returns The settings definition or null if not found
   */
  async getByName(name: string): Promise<PageSettingsDefinition | null> {
    return this.repository.getByName(name);
  }

  /**
   * Creates a new page settings definition
   * @param definition The settings definition to create
   */
  async createDefinition(definition: PageSettingsDefinition): Promise<void> {
    // Check if a definition with this name already exists
    const existingDefinition = await this.repository.getByName(definition.settingName);
    if (existingDefinition) {
      throw new Error(
        `A page settings definition with name ${definition.settingName} already exists`
      );
    }

    await this.repository.save(definition);
  }

  /**
   * Updates an existing page settings definition
   * @param name Settings name identifier
   * @param definition Updated settings definition data
   */
  async updateDefinition(name: string, definition: PageSettingsDefinition): Promise<void> {
    // Check if the definition exists
    const existingDefinition = await this.repository.getByName(name);
    if (!existingDefinition) {
      throw new Error(`Page settings definition with name ${name} not found`);
    }

    // Ensure the name in the path matches the name in the body
    if (definition.settingName !== name) {
      throw new Error('Setting name in path does not match setting name in request body');
    }

    await this.repository.save(definition);
  }

  /**
   * Deletes a page settings definition
   * @param name Settings name identifier
   */
  async deleteDefinition(name: string): Promise<void> {
    // Check if the definition exists
    const existingDefinition = await this.repository.getByName(name);
    if (!existingDefinition) {
      throw new Error(`Page settings definition with name ${name} not found`);
    }

    await this.repository.delete(name);
  }

  /**
   * Retrieves page settings definitions by category
   * @param category The category to filter by
   * @returns Array of settings definitions in the specified category
   */
  async getByCategory(category: string): Promise<PageSettingsDefinition[]> {
    const allDefinitions = await this.repository.getAll();
    // Filter by category and maintain sort order
    return allDefinitions
      .filter(definition => definition.category === category)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Retrieves page settings definitions by group
   * @param group The group to filter by
   * @returns Array of settings definitions in the specified group
   */
  async getByGroup(group: string): Promise<PageSettingsDefinition[]> {
    const allDefinitions = await this.repository.getAll();
    // Filter by group and maintain sort order
    return allDefinitions
      .filter(definition => definition.group === group)
      .sort((a, b) => a.order - b.order);
  }
}
