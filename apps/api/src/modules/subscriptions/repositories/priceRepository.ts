import { D1Database } from '@cloudflare/workers-types';
import { IPriceRepository } from '../services/interfaces';
import { Price } from '../models/schemas';

export class PriceRepository implements IPriceRepository {
  constructor(private readonly db: D1Database) {}

  async getPricesByPlanId(planId: string): Promise<Price[]> {
    const result = await this.db.prepare(`
      SELECT * FROM "Price" WHERE planId = ? ORDER BY interval ASC
    `).bind(planId).all();

    if (!result.results) return [];
    
    return result.results.map(row => this.parsePriceResult(row));
  }

  async getPriceById(id: string): Promise<Price | null> {
    const result = await this.db.prepare(`
      SELECT * FROM "Price" WHERE id = ?
    `).bind(id).first();
    
    if (!result) return null;
    
    return this.parsePriceResult(result);
  }

  private parsePriceResult(result: any): Price {
    return {
      id: result.id,
      planId: result.planId,
      productId: result.productId,
      currency: result.currency,
      interval: result.interval,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      billingScheme: result.billingScheme,
      type: result.type
    };
  }
}