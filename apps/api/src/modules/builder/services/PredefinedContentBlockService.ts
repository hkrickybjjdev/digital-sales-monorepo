import { PredefinedContentBlock } from '../models/schemas';
import { PredefinedContentBlockRepository } from '../repositories/PredefinedContentBlockRepository';

/**
 * Service class for business logic related to PredefinedContentBlock entities
 */
export class PredefinedContentBlockService {
  
  constructor(private readonly repository: PredefinedContentBlockRepository) {    
  }

  /**
   * Retrieves all predefined content blocks
   * @returns Array of content blocks
   */
  async getAll(): Promise<PredefinedContentBlock[]> {
    return this.repository.getAll();
  }

  /**
   * Retrieves a predefined content block by its type
   * @param type Block type identifier
   * @returns The content block or null if not found
   */
  async getByType(type: string): Promise<PredefinedContentBlock | null> {
    return this.repository.getByType(type);
  }

  /**
   * Creates a new predefined content block
   * @param block The content block to create
   */
  async createBlock(block: PredefinedContentBlock): Promise<void> {
    // Check if a block with this type already exists
    const existingBlock = await this.repository.getByType(block.type);
    if (existingBlock) {
      throw new Error(`A content block with type ${block.type} already exists`);
    }

    await this.repository.save(block);
  }

  /**
   * Updates an existing predefined content block
   * @param type Block type identifier
   * @param block Updated block data
   */
  async updateBlock(type: string, block: PredefinedContentBlock): Promise<void> {
    // Check if the block exists
    const existingBlock = await this.repository.getByType(type);
    if (!existingBlock) {
      throw new Error(`Content block with type ${type} not found`);
    }

    // Ensure the type in the path matches the type in the body
    if (block.type !== type) {
      throw new Error('Block type in path does not match block type in request body');
    }

    // Increment version number when updating
    const updatedBlock = {
      ...block,
      version: existingBlock.version + 1,
    };

    await this.repository.save(updatedBlock);
  }

  /**
   * Deletes a predefined content block
   * @param type Block type identifier
   */
  async deleteBlock(type: string): Promise<void> {
    // Check if the block exists
    const existingBlock = await this.repository.getByType(type);
    if (!existingBlock) {
      throw new Error(`Content block with type ${type} not found`);
    }

    await this.repository.delete(type);
  }

  /**
   * Retrieves predefined content blocks by category
   * @param category The category to filter by
   * @returns Array of content blocks in the specified category
   */
  async getByCategory(category: string): Promise<PredefinedContentBlock[]> {
    const allBlocks = await this.repository.getAll();
    return allBlocks.filter(block => block.category === category);
  }

  /**
   * Retrieves all public predefined content blocks
   * @returns Array of public content blocks
   */
  async getPublicBlocks(): Promise<PredefinedContentBlock[]> {
    const allBlocks = await this.repository.getAll();
    return allBlocks.filter(block => block.isPublic);
  }
}
