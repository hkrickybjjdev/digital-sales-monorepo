import { D1Database } from '@cloudflare/workers-types';
import { 
  Page, 
  CreatePageRequest, 
  UpdatePageRequest,
  PageType
} from '../models/schemas';
import { PageRepository } from '../repositories/pageRepository';
import { KVNamespace } from '@cloudflare/workers-types';
import { IPageService, IPageRepository, IPageCacheService } from '../services/interfaces';
import { PageCacheService } from './cache';

export class PageService implements IPageService {
  private pageRepository: IPageRepository;
  private pageCacheService: IPageCacheService;
  
  constructor(db: D1Database, cacheStore: KVNamespace) {
    this.pageRepository = new PageRepository(db);
    this.pageCacheService = new PageCacheService(cacheStore);
  }

  async createPage(userId: string, request: CreatePageRequest): Promise<Page> {
    const page = await this.pageRepository.createPage(userId, request);
    
    // Cache the page if it's active
    await this.pageCacheService.cachePage(page);
    
    return page;
  }

  async getPageById(id: string): Promise<Page | null> {
    return await this.pageRepository.getPageById(id);
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    // Try to get from cache first
    const cachedPage = await this.pageCacheService.getPageFromCache(shortId);
    if (cachedPage) {
      // Asynchronously increment view count without waiting for result
      this.pageCacheService.incrementPageViews(cachedPage.id, shortId)
        .catch(error => console.error('Error incrementing page views:', error));
      return cachedPage;
    }
    
    // If not in cache, get from database
    const page = await this.pageRepository.getPageByShortId(shortId);
    
    // Store in cache for future requests if found and active
    if (page) {
      await this.pageCacheService.cachePage(page);
      
      // Asynchronously increment view count without waiting for result
      this.pageCacheService.incrementPageViews(page.id, shortId)
        .catch(error => console.error('Error incrementing page views:', error));
    }
    
    return page;
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null> {
    // Get page first to find its shortId (for cache invalidation)
    const existingPage = await this.pageRepository.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      return null;
    }
    
    const updatedPage = await this.pageRepository.updatePage(id, userId, request);
    
    // Invalidate cache if updated successfully
    if (updatedPage && updatedPage.shortId) {
      await this.pageCacheService.invalidatePageCache(updatedPage.shortId);
      
      // Re-cache if the page is active
      if (updatedPage.isActive) {
        await this.pageCacheService.cachePage(updatedPage);
      }
    }
    
    return updatedPage;
  }

  async deletePage(id: string, userId: string): Promise<boolean> {
    // Get page first to find its shortId (for cache invalidation)
    const existingPage = await this.pageRepository.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      return false;
    }
    
    const deleted = await this.pageRepository.deletePage(id, userId);
    
    // Invalidate cache if deleted successfully
    if (deleted && existingPage.shortId) {
      await this.pageCacheService.invalidatePageCache(existingPage.shortId);
    }
    
    return deleted;
  }

  async listUserPages(userId: string, limit = 20, offset = 0, type?: PageType): Promise<{
    pages: Page[];
    total: number;
    hasMore: boolean;
  }> {
    const [pages, total] = await Promise.all([
      this.pageRepository.listUserPages(userId, limit, offset, type),
      this.pageRepository.getUserPagesCount(userId, type)
    ]);
    
    return {
      pages,
      total,
      hasMore: offset + pages.length < total
    };
  }
}