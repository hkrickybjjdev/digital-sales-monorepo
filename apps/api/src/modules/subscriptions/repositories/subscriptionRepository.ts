import { D1Database } from '@cloudflare/workers-types';

import { generateUUID } from '../../../utils/utils';
import { Subscription } from '../models/schemas';
import { ISubscriptionRepository } from '../services/interfaces';

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly db: D1Database) {}

  async createSubscription(subscription: Subscription): Promise<Subscription> {
    await this.db
      .prepare(
        `
      INSERT INTO "Subscription" (
        id, teamId, planId, startDate, endDate, status, 
        paymentGateway, subscriptionId, createdAt, updatedAt, cancelAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        subscription.id,
        subscription.teamId,
        subscription.planId,
        subscription.startDate,
        subscription.endDate,
        subscription.status,
        subscription.paymentGateway,
        subscription.subscriptionId,
        subscription.createdAt,
        subscription.updatedAt,
        subscription.cancelAt
      )
      .run();

    return subscription;
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Subscription" WHERE id = ?
    `
      )
      .bind(id)
      .first();

    if (!result) return null;

    return this.parseSubscriptionResult(result);
  }

  async getTeamSubscriptions(teamId: string): Promise<Subscription[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Subscription" 
      WHERE teamId = ? 
      ORDER BY createdAt DESC
    `
      )
      .bind(teamId)
      .all();

    if (!result.results) return [];

    return result.results.map(row => this.parseSubscriptionResult(row));
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    // First check if subscription exists
    const existing = await this.getSubscriptionById(id);
    if (!existing) return null;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    // For each property in data, add to the updates array
    Object.entries(data).forEach(([key, value]) => {
      // Don't update id and always update updatedAt
      if (key !== 'id' && key !== 'updatedAt') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    // Always update the updatedAt timestamp
    updates.push('updatedAt = ?');
    values.push(Date.now());

    if (updates.length > 0) {
      await this.db
        .prepare(
          `
        UPDATE "Subscription" SET ${updates.join(', ')} WHERE id = ?
      `
        )
        .bind(...values, id)
        .run();
    }

    // Return the updated subscription
    return this.getSubscriptionById(id);
  }

  async checkUserSubscriptionAccess(subscriptionId: string, userId: string): Promise<boolean> {
    // Check if the user is a member of the team that owns this subscription
    const result = await this.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM "Subscription" s
      JOIN "TeamMember" tm ON s.teamId = tm.teamId
      WHERE s.id = ? AND tm.userId = ?
    `
      )
      .bind(subscriptionId, userId)
      .first<{ count: number }>();

    return result !== null && result.count > 0;
  }

  async checkUserTeamAccess(teamId: string, userId: string): Promise<boolean> {
    // Check if the user is a member of the given team
    const result = await this.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM "TeamMember"
      WHERE teamId = ? AND userId = ?
    `
      )
      .bind(teamId, userId)
      .first<{ count: number }>();

    return result !== null && result.count > 0;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Subscription" 
      WHERE subscriptionId = ? AND paymentGateway = 'stripe'
      ORDER BY createdAt DESC
    `
      )
      .bind(stripeSubscriptionId)
      .all();

    if (!result.results) return [];

    return result.results.map(row => this.parseSubscriptionResult(row));
  }

  private parseSubscriptionResult(row: any): Subscription {
    return {
      id: row.id,
      teamId: row.teamId,
      planId: row.planId,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      paymentGateway: row.paymentGateway,
      subscriptionId: row.subscriptionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      cancelAt: row.cancelAt,
    };
  }
}
