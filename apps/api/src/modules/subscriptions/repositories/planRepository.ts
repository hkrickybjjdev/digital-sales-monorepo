import { D1Database } from '@cloudflare/workers-types';

import { Plan, Price } from '../models/schemas';
import { IPlanRepository } from '../services/interfaces';

export class PlanRepository implements IPlanRepository {
  constructor(private readonly db: D1Database) {}

  async getPlans(visibleOnly: boolean = true): Promise<Plan[]> {
    const query = visibleOnly
      ? `SELECT * FROM "Plan" WHERE isVisible = 1 ORDER BY name`
      : `SELECT * FROM "Plan" ORDER BY name`;

    const result = await this.db.prepare(query).all();

    if (!result.results) return [];

    return result.results.map(row => this.parsePlanResult(row));
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Plan" WHERE id = ?
    `
      )
      .bind(id)
      .first();

    if (!result) return null;

    return this.parsePlanResult(result);
  }

  async getPricesForPlan(planId: string): Promise<Price[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Price" WHERE planId = ? ORDER BY interval
    `
      )
      .bind(planId)
      .all();

    if (!result.results) return [];

    return result.results.map(row => this.parsePriceResult(row));
  }

  private parsePlanResult(row: any): Plan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isVisible: row.isVisible,
      features: row.features,
    };
  }

  private parsePriceResult(row: any): Price {
    return {
      id: row.id,
      planId: row.planId,
      productId: row.productId,
      currency: row.currency,
      interval: row.interval,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      billingScheme: row.billingScheme,
      type: row.type,
    };
  }
}
