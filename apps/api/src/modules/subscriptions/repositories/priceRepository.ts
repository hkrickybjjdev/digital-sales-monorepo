import { DatabaseFactory } from '../../../database/databaseFactory';
import { SQLDatabase } from '../../../database/sqlDatabase';
import { Env } from '../../../types';
import { Price } from '../models/schemas';
import { IPriceRepository } from '../services/interfaces';

export class PriceRepository implements IPriceRepository {
  private dbService: SQLDatabase;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async getPricesByPlanId(planId: string): Promise<Price[]> {
    return this.getPricesForPlan(planId);
  }

  async getPriceById(id: string): Promise<Price | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM "Price" WHERE id = ?`,
      params: [id],
    });

    if (!result) return null;

    return {
      id: result.id,
      planId: result.planId,
      productId: result.productId,
      currency: result.currency,
      interval: result.interval,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
      billingScheme: result.billingScheme,
      type: result.type,
    };
  }

  async getPricesForPlan(planId: string): Promise<Price[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `SELECT * FROM "Price" WHERE planId = ? ORDER BY interval`,
      params: [planId],
    });

    return results.map(row => ({
      id: row.id,
      planId: row.planId,
      productId: row.productId,
      currency: row.currency,
      interval: row.interval,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      billingScheme: row.billingScheme,
      type: row.type,
    }));
  }

  async getPricesByInterval(interval: string): Promise<Price[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `SELECT * FROM "Price" WHERE interval = ?`,
      params: [interval],
    });

    return results.map(row => ({
      id: row.id,
      planId: row.planId,
      productId: row.productId,
      currency: row.currency,
      interval: row.interval,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      billingScheme: row.billingScheme,
      type: row.type,
    }));
  }
}
