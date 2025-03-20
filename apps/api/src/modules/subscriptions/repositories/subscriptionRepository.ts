import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { Subscription } from '../models/schemas';
import { ISubscriptionRepository } from '../services/interfaces';

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  async createSubscription(
    subscription: Subscription,
    context?: RequestContext
  ): Promise<Subscription> {
    await this.dbService.executeWithAudit(
      {
        sql: `
        INSERT INTO "Subscription" (
          id, teamId, planId, startDate, endDate, status, 
          paymentGateway, subscriptionId, createdAt, updatedAt, cancelAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        params: [
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
          subscription.cancelAt,
        ],
      },
      {
        eventType: 'subscription_created',
        resourceType: 'Subscription',
        resourceId: subscription.id,
        details: JSON.stringify({
          teamId: subscription.teamId,
          planId: subscription.planId,
          status: subscription.status,
        }),
        outcome: 'success',
      },
      context
    );

    return subscription;
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT * FROM "Subscription" WHERE id = ?`,
      params: [id],
    });

    if (!result) return null;

    return this.parseSubscriptionResult(result);
  }

  async getTeamSubscriptions(teamId: string): Promise<Subscription[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `
        SELECT * FROM "Subscription" 
        WHERE teamId = ? 
        ORDER BY createdAt DESC
      `,
      params: [teamId],
    });

    return results.map(this.parseSubscriptionResult);
  }

  async updateSubscription(
    id: string,
    data: Partial<Subscription>,
    context?: RequestContext
  ): Promise<Subscription | null> {
    const existingSubscription = await this.getSubscriptionById(id);
    if (!existingSubscription) {
      return null;
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updateFields.push('status = ?');
      values.push(data.status);
    }

    if (data.endDate !== undefined) {
      updateFields.push('endDate = ?');
      values.push(data.endDate);
    }

    if (data.cancelAt !== undefined) {
      updateFields.push('cancelAt = ?');
      values.push(data.cancelAt);
    }

    if (updateFields.length === 0) {
      return existingSubscription;
    }

    const now = Date.now();
    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE "Subscription" 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `,
        params: values,
      },
      {
        eventType: 'subscription_updated',
        resourceType: 'Subscription',
        resourceId: id,
        details: JSON.stringify(data),
        outcome: 'success',
      },
      context
    );

    return this.getSubscriptionById(id);
  }

  async checkUserSubscriptionAccess(subscriptionId: string, userId: string): Promise<boolean> {
    const result = await this.dbService.queryOne<any>({
      sql: `
        SELECT 1 FROM "Subscription" s
        JOIN "TeamMember" tm ON s.teamId = tm.teamId
        WHERE s.id = ? AND tm.userId = ?
      `,
      params: [subscriptionId, userId],
    });

    return result !== null;
  }

  async checkUserTeamAccess(teamId: string, userId: string): Promise<boolean> {
    const result = await this.dbService.queryOne<any>({
      sql: `
        SELECT 1 FROM "TeamMember"
        WHERE teamId = ? AND userId = ?
      `,
      params: [teamId, userId],
    });

    return result !== null;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription[]> {
    const results = await this.dbService.queryMany<any>({
      sql: `
        SELECT * FROM "Subscription" 
        WHERE subscriptionId = ? 
        ORDER BY createdAt DESC
      `,
      params: [stripeSubscriptionId],
    });

    return results.map(this.parseSubscriptionResult);
  }

  private parseSubscriptionResult(row: any): Subscription {
    return {
      id: row.id,
      teamId: row.teamId,
      planId: row.planId,
      startDate: Number(row.startDate),
      endDate: row.endDate ? Number(row.endDate) : null,
      status: row.status,
      paymentGateway: row.paymentGateway,
      subscriptionId: row.subscriptionId,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      cancelAt: row.cancelAt ? Number(row.cancelAt) : null,
    };
  }
}
