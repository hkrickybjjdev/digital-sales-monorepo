import { D1Database } from '@cloudflare/workers-types';
import { Subscription, SubscriptionStatus } from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

export class SubscriptionRepository {
  constructor(private readonly db: D1Database) {}
  
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.db.prepare(
      `SELECT id, userId, planId, startDate, endDate, status, stripeSubscriptionId
       FROM "Subscription"
       WHERE id = ?`
    )
    .bind(id)
    .first<Subscription>();
    
    return result;
  }
  
  async getActiveSubscriptionByUser(userId: string): Promise<Subscription | null> {
    const result = await this.db.prepare(
      `SELECT id, userId, planId, startDate, endDate, status, stripeSubscriptionId
       FROM "Subscription"
       WHERE userId = ? AND status IN ('active', 'free', 'trial')
       ORDER BY startDate DESC
       LIMIT 1`
    )
    .bind(userId)
    .first<Subscription>();
    
    return result;
  }
  
  async createSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    const id = `sub_${uuidv4()}`;
    
    await this.db.prepare(
      `INSERT INTO "Subscription" (id, userId, planId, startDate, endDate, status, stripeSubscriptionId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      subscription.userId,
      subscription.planId,
      subscription.startDate,
      subscription.endDate,
      subscription.status,
      subscription.stripeSubscriptionId,
      subscription.createdAt,
      subscription.updatedAt
    )
    .run();
    
    return {
      id,
      ...subscription
    };
  }
  
  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) return null;
    
    const updates = [];
    const params = [];
    
    if (data.planId !== undefined) {
      updates.push('planId = ?');
      params.push(data.planId);
    }
    
    if (data.endDate !== undefined) {
      updates.push('endDate = ?');
      params.push(data.endDate);
    }
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (data.stripeSubscriptionId !== undefined) {
      updates.push('stripeSubscriptionId = ?');
      params.push(data.stripeSubscriptionId);
    }
    
    if (updates.length === 0) return subscription;
    
    params.push(id);
    
    const statement = this.db.prepare(
      `UPDATE "Subscription" 
       SET ${updates.join(', ')}
       WHERE id = ?`
    );
    
    // Bind all parameters
    let bindStatement = statement;
    for (const param of params) {
      bindStatement = bindStatement.bind(param);
    }
    
    await bindStatement.run();
    
    return this.getSubscriptionById(id);
  }
  
  async cancelSubscription(id: string, endDate: string): Promise<Subscription | null> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) return null;
    
    await this.db.prepare(
      `UPDATE "Subscription" 
       SET status = 'canceled', endDate = ?
       WHERE id = ?`
    )
    .bind(endDate, id)
    .run();
    
    return this.getSubscriptionById(id);
  }
  
  async deleteSubscription(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "Subscription"
       WHERE id = ?`
    )
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async listUserSubscriptions(userId: string): Promise<Subscription[]> {
    const result = await this.db.prepare(
      `SELECT id, userId, planId, startDate, endDate, status, stripeSubscriptionId
       FROM "Subscription"
       WHERE userId = ?
       ORDER BY startDate DESC`
    )
    .bind(userId)
    .all<Subscription>();
    
    return result.results;
  }
  
  async listSubscriptionsByStatus(status: SubscriptionStatus, limit = 50, offset = 0): Promise<Subscription[]> {
    const result = await this.db.prepare(
      `SELECT id, userId, planId, startDate, endDate, status, stripeSubscriptionId
       FROM "Subscription"
       WHERE status = ?
       ORDER BY startDate DESC
       LIMIT ? OFFSET ?`
    )
    .bind(status, limit, offset)
    .all<Subscription>();
    
    return result.results;
  }
  
  async getExpiredSubscriptions(currentDate: string): Promise<Subscription[]> {
    const result = await this.db.prepare(
      `SELECT id, userId, planId, startDate, endDate, status, stripeSubscriptionId
       FROM "Subscription"
       WHERE status = 'active' AND endDate < ?`
    )
    .bind(currentDate)
    .all<Subscription>();
    
    return result.results;
  }
  
  async countActiveSubscribersByPlan(planId: string): Promise<number> {
    const result = await this.db.prepare(
      `SELECT COUNT(*) as count
       FROM "Subscription"
       WHERE planId = ? AND status IN ('active', 'trial')`
    )
    .bind(planId)
    .first<{ count: number }>();
    
    return result ? result.count : 0;
  }
}