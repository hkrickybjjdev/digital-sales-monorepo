import { SQLDatabase } from '../../../database/sqlDatabase';
import { Plan, Price } from '../models/schemas';
import { IPlanRepository } from '../services/interfaces';

export class PlanRepository implements IPlanRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  async getPlans(visibleOnly = true): Promise<Plan[]> {
    return this.getAllPlans(visibleOnly);
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM "Plan" WHERE id = ?`,
      params: [id],
    });

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      isVisible: Boolean(result.isVisible),
      features: JSON.parse(result.features || '{}'),
    };
  }

  async getAllPlans(visibleOnly = true): Promise<Plan[]> {
    const sql = visibleOnly
      ? `SELECT * FROM "Plan" WHERE isVisible = 1 ORDER BY id`
      : `SELECT * FROM "Plan" ORDER BY id`;

    const results = await this.dbService.queryMany<any>({
      sql,
    });

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isVisible: Boolean(row.isVisible),
      features: JSON.parse(row.features || '{}'),
    }));
  }

  async getFreePlan(): Promise<Plan | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM "Plan" WHERE id = 'plan_free'`,
    });

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      isVisible: Boolean(result.isVisible),
      features: JSON.parse(result.features || '{}'),
    };
  }

  async getPricesForPlan(planId: string): Promise<Price[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `SELECT * FROM "Price" WHERE planId = ? ORDER BY interval`,
      params: [planId],
    });

    return results.map(row => this.parsePriceResult(row));
  }

  private parsePriceResult(row: any): Price {
    return {
      id: row.id,
      planId: row.planId,
      productId: row.productId,
      currency: row.currency,
      interval: row.interval,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      billingScheme: row.billingScheme,
      type: row.type,
    };
  }
}
