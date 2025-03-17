import { Page, PageStats } from '../types';

import { IPageCacheService } from './interfaces';

export class PageCacheService implements IPageCacheService {
  constructor(private readonly kv: KVNamespace) {}

  // Key formats
  private pageKey(shortId: string): string {
    return `page:${shortId}`;
  }

  private pageStatsKey(id: string): string {
    return `stats:${id}`;
  }

  // Caching active page data for quick retrieval
  async cachePage(page: Page, expirationTtl?: number): Promise<void> {
    if (!page.isActive) return;

    const key = this.pageKey(page.shortId);

    // Determine TTL based on expiration date if provided
    let ttl = expirationTtl;
    if (!ttl && page.expiresAt) {
      const expiresAt = new Date(page.expiresAt).getTime();
      const now = Date.now();
      if (expiresAt > now) {
        ttl = Math.floor((expiresAt - now) / 1000);
      }
    }

    await this.kv.put(key, JSON.stringify(page), { expirationTtl: ttl });
  }

  async getPageFromCache(shortId: string): Promise<Page | null> {
    const key = this.pageKey(shortId);
    const cached = await this.kv.get(key);

    if (!cached) return null;

    try {
      const page = JSON.parse(cached) as Page;
      console.log(`Page ${shortId} retrieved from cache`);
      return page;
    } catch (error) {
      console.error('Error parsing cached page:', error);
      return null;
    }
  }

  async invalidatePageCache(shortId: string): Promise<void> {
    const key = this.pageKey(shortId);
    await this.kv.delete(key);
  }

  // Page stats - views, conversions
  async incrementPageViews(id: string, shortId: string): Promise<void> {
    const key = this.pageStatsKey(id);

    // Optimistically update stats
    try {
      const currentStats = await this.getPageStats(id);
      const updatedStats = {
        ...currentStats,
        views: (currentStats?.views || 0) + 1,
      };

      await this.kv.put(key, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error incrementing page views:', error);
    }
  }

  async incrementConversions(id: string, shortId: string): Promise<void> {
    const key = this.pageStatsKey(id);

    try {
      const currentStats = await this.getPageStats(id);
      const updatedStats = {
        views: currentStats?.views || 0,
        conversions: (currentStats?.conversions || 0) + 1,
        conversionRate: 0,
      };

      // Calculate conversion rate
      if (updatedStats.views > 0) {
        updatedStats.conversionRate = (updatedStats.conversions / updatedStats.views) * 100;
      }

      await this.kv.put(key, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error incrementing conversions:', error);
    }
  }

  async getPageStats(id: string): Promise<PageStats | null> {
    const key = this.pageStatsKey(id);
    const cached = await this.kv.get(key);

    if (!cached) {
      return {
        views: 0,
        conversions: 0,
        conversionRate: 0,
      };
    }

    try {
      return JSON.parse(cached) as PageStats;
    } catch (error) {
      console.error('Error parsing page stats:', error);
      return null;
    }
  }
}
