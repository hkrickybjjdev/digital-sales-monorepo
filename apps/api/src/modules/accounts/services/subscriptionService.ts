import { D1Database } from '@cloudflare/workers-types';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { PlanRepository } from '../repositories/planRepository';
import { CreateSubscriptionRequest, Plan, Subscription, UpdateSubscriptionRequest } from '../models/schemas';

export class SubscriptionService {
  private subscriptionRepository: SubscriptionRepository;
  private planRepository: PlanRepository;
  
  constructor(db: D1Database) {
    this.subscriptionRepository = new SubscriptionRepository(db);
    this.planRepository = new PlanRepository(db);
  }
  
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    return this.subscriptionRepository.getSubscriptionById(id);
  }
  
  async getActiveSubscriptionByUser(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.getActiveSubscriptionByUser(userId);
  }
  
  async getUserSubscriptionWithPlan(userId: string): Promise<{ subscription: Subscription; plan: Plan } | null> {
    const subscription = await this.getActiveSubscriptionByUser(userId);
    if (!subscription) return null;
    
    const plan = await this.planRepository.getPlanById(subscription.planId);
    if (!plan) return null;
    
    return { subscription, plan };
  }
  
  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription | null> {
    const plan = await this.planRepository.getPlanById(data.planId);
    if (!plan) return null;
    
    const now = Date.now();
    let endDate: number | null = null;
    
    // For free plans or trials, set an end date 30 days in the future
    if (plan.priceInCents === 0 || !data.paymentMethodId) {
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 30);
      endDate = endDateObj.getTime();
    }
    
    // If it's a free plan, mark as 'free', otherwise as 'active'
    const status = plan.priceInCents === 0 ? 'free' : (data.paymentMethodId ? 'active' : 'trial');
    
    // Process Stripe subscription if it's a paid plan and we have a payment method
    let stripeSubscriptionId: string | null = null;
    if (plan.priceInCents > 0 && data.paymentMethodId) {
      // This would integrate with a payments service in a real implementation
      // stripeSubscriptionId = await paymentsService.createSubscription(data.userId, data.planId, data.paymentMethodId);
    }
    
    return this.subscriptionRepository.createSubscription({
      userId: data.userId,
      planId: data.planId,
      startDate: now,
      endDate,
      status,
      stripeSubscriptionId,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  async updateSubscription(id: string, data: UpdateSubscriptionRequest): Promise<Subscription | null> {
    return this.subscriptionRepository.updateSubscription(id, data);
  }
  
  async cancelSubscription(id: string): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.getSubscriptionById(id);
    if (!subscription) return null;
    
    // Set end date to now
    const now = Date.now();
    
    // If there's an active Stripe subscription, cancel it
    if (subscription.stripeSubscriptionId) {
      // This would integrate with a payments service in a real implementation
      // await paymentsService.cancelSubscription(subscription.stripeSubscriptionId);
    }
    
    return this.subscriptionRepository.cancelSubscription(id, now);
  }
  
  async upgradeSubscription(userId: string, newPlanId: string, paymentMethodId?: string): Promise<Subscription | null> {
    const currentSubscription = await this.subscriptionRepository.getActiveSubscriptionByUser(userId);
    const newPlan = await this.planRepository.getPlanById(newPlanId);
    
    if (!newPlan) return null;
    
    // If there's an existing subscription, cancel it
    if (currentSubscription) {
      await this.cancelSubscription(currentSubscription.id);
    }
    
    // Create a new subscription with the new plan
    return this.createSubscription({
      userId,
      planId: newPlanId,
      paymentMethodId
    });
  }
  
  async listUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.listUserSubscriptions(userId);
  }
  
  async processExpiredSubscriptions(): Promise<number> {
    const now = Date.now();
    const expiredSubscriptions = await this.subscriptionRepository.getExpiredSubscriptions(now);
    
    let processedCount = 0;
    for (const subscription of expiredSubscriptions) {
      // For subscriptions with stripeSubscriptionId, this would check Stripe for status
      await this.subscriptionRepository.updateSubscription(subscription.id, { status: 'canceled' });
      processedCount++;
    }
    
    return processedCount;
  }
  
  async getSubscriptionCounts(): Promise<Record<string, number>> {
    const plans = await this.planRepository.listAllPlans();
    const counts: Record<string, number> = {};
    
    for (const plan of plans) {
      counts[plan.id] = await this.subscriptionRepository.countActiveSubscribersByPlan(plan.id);
    }
    
    return counts;
  }
  
  async assignFreePlanToUser(userId: string): Promise<Subscription | null> {
    const freePlan = await this.planRepository.getPlanById('plan_free');
    if (!freePlan) return null;
    
    return this.createSubscription({
      userId,
      planId: freePlan.id
    });
  }
}