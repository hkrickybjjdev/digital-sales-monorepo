import { Page as DbPage } from './models/schemas';

export interface Page extends DbPage {
  // Additional properties can be defined here
}

export interface PageStats {
  views: number;
  conversions: number;
  conversionRate: number;
  lastViewed?: Date;
}
