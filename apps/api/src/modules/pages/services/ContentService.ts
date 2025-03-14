import { D1Database } from '@cloudflare/workers-types';
import { 
  PageContent, 
  CreatePageContentRequest
} from '../models/schemas';
import { ContentRepository } from '../repositories/contentRepository';
import { IContentService, IContentRepository } from '../services/interfaces';

export class ContentService implements IContentService {
  private contentRepository: IContentRepository;
  
  constructor(db: D1Database) {
    this.contentRepository = new ContentRepository(db);
  }

  async createPageContent(pageId: string, userId: string, request: CreatePageContentRequest): Promise<PageContent | null> {
    return await this.contentRepository.createPageContent(pageId, userId, request);
  }

  async getPageContentById(id: string): Promise<PageContent | null> {
    return await this.contentRepository.getPageContentById(id);
  }

  async getPageContents(pageId: string): Promise<PageContent[]> {
    return await this.contentRepository.getPageContents(pageId);
  }

  async updatePageContent(id: string, pageId: string, userId: string, updates: Partial<CreatePageContentRequest>): Promise<PageContent | null> {
    return await this.contentRepository.updatePageContent(id, pageId, userId, updates);
  }

  async deletePageContent(id: string, pageId: string, userId: string): Promise<boolean> {
    return await this.contentRepository.deletePageContent(id, pageId, userId);
  }
}