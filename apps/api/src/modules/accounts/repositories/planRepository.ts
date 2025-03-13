import { D1Database } from '@cloudflare/workers-types';
import { Plan, PlanFeatures } from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

export class PlanRepository {
  constructor(private readonly db: D1Database) {}
  
  async getPlanById(id: string): Promise<Plan | null> {
    const plan = await this.db.prepare(
      `SELECT id, name, description, priceInCents, currency, interval, isVisible, features
       FROM "Plan"
       WHERE id = ?`
    )
    .bind(id)
    .first<Plan & { features: string }>();
    
    if (!plan) return null;
    
    return {
      ...plan,
      isVisible: Boolean(plan.isVisible),
      features: JSON.parse(plan.features) as PlanFeatures
    };
  }
  
  async createPlan(plan: Omit<Plan, 'id'>): Promise<Plan> {
    const id = `plan_${uuidv4()}`;
    
    await this.db.prepare(
      `INSERT INTO "Plan" (id, name, description, priceInCents, currency, interval, isVisible, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      plan.name,
      plan.description,
      plan.priceInCents,
      plan.currency,
      plan.interval,
      plan.isVisible ? 1 : 0,
      JSON.stringify(plan.features)
    )
    .run();
    
    return {
      id,
      ...plan
    };
  }
  
  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan | null> {
    const plan = await this.getPlanById(id);
    if (!plan) return null;
    
    const updates = [];
    const params = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    
    if (data.priceInCents !== undefined) {
      updates.push('priceInCents = ?');
      params.push(data.priceInCents);
    }
    
    if (data.currency !== undefined) {
      updates.push('currency = ?');
      params.push(data.currency);
    }
    
    if (data.interval !== undefined) {
      updates.push('interval = ?');
      params.push(data.interval);
    }
    
    if (data.isVisible !== undefined) {
      updates.push('isVisible = ?');
      params.push(data.isVisible ? 1 : 0);
    }
    
    if (data.features !== undefined) {
      updates.push('features = ?');
      params.push(JSON.stringify(data.features));
    }
    
    if (updates.length === 0) return plan;
    
    params.push(id);
    
    const statement = this.db.prepare(
      `UPDATE "Plan" 
       SET ${updates.join(', ')}
       WHERE id = ?`
    );
    
    // Bind all parameters
    let bindStatement = statement;
    for (const param of params) {
      bindStatement = bindStatement.bind(param);
    }
    
    await bindStatement.run();
    
    return this.getPlanById(id);
  }
  
  async deletePlan(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "Plan"
       WHERE id = ?`
    )
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async listVisiblePlans(): Promise<Plan[]> {
    const result = await this.db.prepare(
      `SELECT id, name, description, priceInCents, currency, interval, isVisible, features
       FROM "Plan"
       WHERE isVisible = 1
       ORDER BY priceInCents ASC`
    )
    .all<Plan & { features: string }>();
    
    return result.results.map(plan => ({
      ...plan,
      isVisible: Boolean(plan.isVisible),
      features: JSON.parse(plan.features) as PlanFeatures
    }));
  }
  
  async listAllPlans(): Promise<Plan[]> {
    const result = await this.db.prepare(
      `SELECT id, name, description, priceInCents, currency, interval, isVisible, features
       FROM "Plan"
       ORDER BY priceInCents ASC`
    )
    .all<Plan & { features: string }>();
    
    return result.results.map(plan => ({
      ...plan,
      isVisible: Boolean(plan.isVisible),
      features: JSON.parse(plan.features) as PlanFeatures
    }));
  }
}