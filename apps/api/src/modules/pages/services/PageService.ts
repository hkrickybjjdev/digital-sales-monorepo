import { KVNamespace } from '@cloudflare/workers-types';

import { Page, CreatePageRequest, UpdatePageRequest, PageType } from '../models/schemas';
import { PageRepository } from '../repositories/pageRepository';
import { IPageService, IPageRepository, IPageCacheService } from '../services/interfaces';
import { RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';

import { PageCacheService } from './cache';

export class PageService implements IPageService {
  private pageRepository: IPageRepository;
  private pageCacheService: IPageCacheService;
  private cacheRefreshPromises: Map<string, Promise<Page | null>> = new Map();

  constructor(env: Env, cacheStore: KVNamespace) {
    this.pageRepository = new PageRepository(env);
    this.pageCacheService = new PageCacheService(cacheStore);
  }

  async createPage(userId: string, request: CreatePageRequest, context?: RequestContext): Promise<Page> {
    console.log(`Creating page for user ${userId}`);
    const page = await this.pageRepository.createPage(userId, request, context);

    // Cache the page if it's active
    //await this.pageCacheService.cachePage(page);
    console.log(`Page created and cached with shortId ${page.shortId}`);

    return page;
  }

  async getPageById(id: string): Promise<Page | null> {
    console.log(`Getting page by ID ${id}`);
    const page = await this.pageRepository.getPageById(id);
    if (page) {
      console.log(`Page found with ID ${id}`);
    } else {
      console.log(`Page not found with ID ${id}`);
    }
    return page;
  }

  async getPageByShortId(shortId: string): Promise<Page | null> {
    console.log(`Getting page by shortId ${shortId}`);
    // Try to get from cache first
    const cachedPage = await this.pageCacheService.getPageFromCache(shortId);
    if (cachedPage) {
      console.log(`Page found in cache with shortId ${shortId}`);
      // Asynchronously increment view count without waiting for result
      this.pageCacheService
        .incrementPageViews(cachedPage.id, shortId)
        .catch(error => console.error('Error incrementing page views:', error));
      return cachedPage;
    }

    console.log(`Page not found in cache with shortId ${shortId}, fetching from database`);
    // Use single flight to prevent cache stampede
    return this.getFromCacheOrDatabase(shortId);
  }

  private async getFromCacheOrDatabase(shortId: string): Promise<Page | null> {
    console.log(`getFromCacheOrDatabase called for shortId ${shortId}`);
    // Check if there's an existing promise for this shortId
    if (this.cacheRefreshPromises.has(shortId)) {
      console.log(`Cache refresh promise found for shortId ${shortId}, awaiting result`);
      return this.cacheRefreshPromises.get(shortId)!; // Return existing promise
    }

    // Create a new promise to fetch and cache the data
    console.log(`No cache refresh promise found for shortId ${shortId}, creating new promise`);
    const refreshPromise = this.fetchAndCachePage(shortId);
    this.cacheRefreshPromises.set(shortId, refreshPromise);

    try {
      console.log(`Awaiting refresh promise for shortId ${shortId}`);
      return await refreshPromise;
    } finally {
      this.cacheRefreshPromises.delete(shortId); // Remove promise when done
      console.log(`Refresh promise completed and removed for shortId ${shortId}`);
    }
  }

  private async fetchAndCachePage(shortId: string): Promise<Page | null> {
    console.log(`fetchAndCachePage called for shortId ${shortId}`);
    // If not in cache, get from database
    const page = await this.pageRepository.getPageByShortId(shortId);

    // Store in cache for future requests if found and active
    if (page) {
      console.log(`Page found in database with shortId ${shortId}, caching`);
      await this.pageCacheService.cachePage(page);

      // Asynchronously increment view count without waiting for result
      this.pageCacheService
        .incrementPageViews(page.id, shortId)
        .catch(error => console.error('Error incrementing page views:', error));
    } else {
      console.log(`Page not found in database with shortId ${shortId}`);
    }

    return page;
  }

  async updatePage(id: string, userId: string, request: UpdatePageRequest, context?: RequestContext): Promise<Page | null> {
    console.log(`Updating page with ID ${id} for user ${userId}`);
    // Get page first to find its shortId (for cache invalidation)
    const existingPage = await this.pageRepository.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      console.log(`Page with ID ${id} not found or does not belong to user ${userId}`);
      return null;
    }

    const updatedPage = await this.pageRepository.updatePage(id, userId, request, context);

    // Invalidate cache if updated successfully
    if (updatedPage && updatedPage.shortId) {
      console.log(
        `Page updated successfully, invalidating cache for shortId ${updatedPage.shortId}`
      );
      await this.pageCacheService.invalidatePageCache(updatedPage.shortId);

      // Re-cache if the page is active
      if (updatedPage.isActive) {
        console.log(`Page is active, re-caching with shortId ${updatedPage.shortId}`);
        await this.pageCacheService.cachePage(updatedPage);
      }
    }

    return updatedPage;
  }

  async deletePage(id: string, userId: string, context?: RequestContext): Promise<boolean> {
    console.log(`Deleting page with ID ${id} for user ${userId}`);
    // Get page first to find its shortId (for cache invalidation)
    const existingPage = await this.pageRepository.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      console.log(`Page with ID ${id} not found or does not belong to user ${userId}`);
      return false;
    }

    const deleted = await this.pageRepository.deletePage(id, userId, context);

    // Invalidate cache if deleted successfully
    if (deleted && existingPage.shortId) {
      console.log(
        `Page deleted successfully, invalidating cache for shortId ${existingPage.shortId}`
      );
      await this.pageCacheService.invalidatePageCache(existingPage.shortId);
    }

    return deleted;
  }

  async togglePageActive(id: string, userId: string, context?: RequestContext): Promise<Page | null> {
    console.log(`Toggling active status for page with ID ${id} for user ${userId}`);
    // Get page first to find its shortId (for cache updates)
    const existingPage = await this.pageRepository.getPageById(id);
    if (!existingPage || existingPage.userId !== userId) {
      console.log(`Page with ID ${id} not found or does not belong to user ${userId}`);
      return null;
    }

    const updatedPage = await this.pageRepository.togglePageActive(id, userId, context);

    // Update cache based on new active status
    if (updatedPage && updatedPage.shortId) {
      if (updatedPage.isActive) {
        console.log(`Page activated, caching with shortId ${updatedPage.shortId}`);
        await this.pageCacheService.cachePage(updatedPage);
      } else {
        console.log(`Page deactivated, invalidating cache for shortId ${updatedPage.shortId}`);
        await this.pageCacheService.invalidatePageCache(updatedPage.shortId);
      }
    }

    return updatedPage;
  }

  async listUserPages(
    userId: string,
    limit = 20,
    offset = 0,
    type?: PageType
  ): Promise<{
    pages: Page[];
    total: number;
    hasMore: boolean;
  }> {
    console.log(
      `Listing pages for user ${userId} with limit ${limit}, offset ${offset}, and type ${type}`
    );
    const [pages, total] = await Promise.all([
      this.pageRepository.listUserPages(userId, limit, offset, type),
      this.pageRepository.getUserPagesCount(userId, type),
    ]);

    return {
      pages,
      total,
      hasMore: offset + pages.length < total,
    };
  }
}
