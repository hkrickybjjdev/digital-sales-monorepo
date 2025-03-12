import { D1Database } from '@cloudflare/workers-types';
import { 
  Page, 
  CreatePageRequest, 
  UpdatePageRequest,
  PageType
} from '../models/schemas';
import { PageRepository } from '../repositories/pageRepository';
import { KVNamespace } from '@cloudflare/workers-types';

export class PageService {
  private pageRepository: PageRepository;
  private cacheStore: KVNamespace;
  
  constructor(db: D1Database, cacheStore: KVNamespace) {
    this.pageRepository = new PageRepository(db);
    this.cacheStore = cacheStore;
  }

  async createPage(userId: string, request: CreatePageRequest): Promise<Page> {
    return await this.pageRepository.createPage(userId, request);
  }

  async getPageById(id: string): Promise<Page | null> {
    return await this.pageRepository.getPageById(id);
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    // Try cache first for active pages
    try {
      const cachedPage = await this.getPageFromCache(shortId);
      if (cachedPage) {
        return cachedPage;
      }
    } catch (error) {
      console.error('Error retrieving page from cache:', error);
    }
    
    // If not in cache, get from DB
    const page = await this.pageRepository.getPageByShortId(shortId);
    
    // If page is active, cache it for future requests
    if (page && page.isActive) {
      try {
        await this.cachePageData(page);
      } catch (error) {
        console.error('Error caching page data:', error);
      }
    }
    
    return page;
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null> {
    const updatedPage = await this.pageRepository.updatePage(id, userId, request);
    
    // If page was updated successfully and is active, update cache
    if (updatedPage && updatedPage.isActive) {
      try {
        await this.cachePageData(updatedPage);
      } catch (error) {
        console.error('Error updating page cache:', error);
      }
    } else if (updatedPage && !updatedPage.isActive) {
      // If page is now inactive, remove from cache
      try {
        await this.removeCachedPage(updatedPage.shortId);
      } catch (error) {
        console.error('Error removing page from cache:', error);
      }
    }
    
    return updatedPage;
  }

  async deletePage(id: string, userId: string): Promise<boolean> {
    // Get page first to get the shortId for cache removal
    const page = await this.pageRepository.getPageById(id);
    const deleted = await this.pageRepository.deletePage(id, userId);
    
    if (deleted && page) {
      try {
        await this.removeCachedPage(page.shortId);
      } catch (error) {
        console.error('Error removing deleted page from cache:', error);
      }
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

  // Cache methods
  private async getPageFromCache(shortId: string): Promise<Page | null> {
    const cachedData = await this.cacheStore.get(`page:${shortId}`);
    if (!cachedData) return null;
    
    try {
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error parsing cached page data:', error);
      return null;
    }
  }

  private async cachePageData(page: Page): Promise<void> {
    // Cache for 1 hour (3600 seconds)
    await this.cacheStore.put(`page:${page.shortId}`, JSON.stringify(page), { expirationTtl: 3600 });
  }

  private async removeCachedPage(shortId: string): Promise<void> {
    await this.cacheStore.delete(`page:${shortId}`);
  }
} 