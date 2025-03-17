import { Page as DbPage } from './models/schemas';

// Re-export the DbPage type directly
export type { DbPage as Page };

export interface PageStats {
  views: number;
  conversions: number;
  conversionRate: number;
  lastViewed?: Date;
}
