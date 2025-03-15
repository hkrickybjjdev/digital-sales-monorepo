import { ISubscriptionService, IPlanRepository, ISubscriptionRepository } from './interfaces';
import { CreateSubscriptionRequest, PlanWithPrices, Subscription, SubscriptionWithPlan, UpdateSubscriptionRequest } from '../models/schemas';
import { generateUUID } from '../../../utils/utils';

export class SubscriptionService implements ISubscriptionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository
  ) {}

  async createSubscription(userId: string, request: CreateSubscriptionRequest): Promise<Subscription> {
    // Verify user has access to the team
    const hasTeamAccess = await this.subscriptionRepository.checkUserTeamAccess(request.teamId, userId);
    if (!hasTeamAccess) {
      throw new Error('User does not have access to this team');
    }
    
    // Verify the plan exists
    const plan = await this.planRepository.getPlanById(request.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if an active subscription already exists for this team
    const existingSubscriptions = await this.subscriptionRepository.getTeamSubscriptions(request.teamId);
    const activeSubscription = existingSubscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSubscription) {
      throw new Error('Team already has an active subscription');
    }

    const now = Date.now();
    
    // Create subscription object
    const subscription: Subscription = {
      id: generateUUID(),
      teamId: request.teamId,
      planId: request.planId,
      startDate: now,
      endDate: null, // For now, we're creating ongoing subscriptions
      status: 'active',
      paymentGateway: null,
      subscriptionId: null, // This would be filled with the actual gateway subscription ID
      createdAt: now,
      updatedAt: now,
      cancelAt: null
    };
    
    // Save the subscription to DB
    return this.subscriptionRepository.createSubscription(subscription);
  }

  async getSubscriptionById(id: string, userId: string): Promise<SubscriptionWithPlan | null> {
    // Check if the user has access to this subscription
    const hasAccess = await this.subscriptionRepository.checkUserSubscriptionAccess(id, userId);
    if (!hasAccess) {
      throw new Error('User does not have access to this subscription');
    }
    
    // Get the subscription
    const subscription = await this.subscriptionRepository.getSubscriptionById(id);
    if (!subscription) return null;
    
    // Get the plan associated with this subscription
    const plan = await this.planRepository.getPlanById(subscription.planId);
    if (!plan) {
      throw new Error('Associated plan not found');
    }
    
    // Return the subscription with plan details
    return {
      ...subscription,
      plan
    };
  }

  async getTeamSubscriptions(teamId: string, userId: string): Promise<SubscriptionWithPlan[]> {
    // Verify user has access to the team
    const hasTeamAccess = await this.subscriptionRepository.checkUserTeamAccess(teamId, userId);
    if (!hasTeamAccess) {
      throw new Error('User does not have access to this team');
    }
    
    // Get all subscriptions for the team
    const subscriptions = await this.subscriptionRepository.getTeamSubscriptions(teamId);
    
    // Enhance each subscription with its plan details
    const subscriptionsWithPlans = await Promise.all(
      subscriptions.map(async (subscription) => {
        const plan = await this.planRepository.getPlanById(subscription.planId);
        return {
          ...subscription,
          plan: plan || undefined
        };
      })
    );
    
    return subscriptionsWithPlans;
  }

  async updateSubscription(id: string, userId: string, request: UpdateSubscriptionRequest): Promise<Subscription | null> {
    // Check if the user has access to this subscription
    const hasAccess = await this.subscriptionRepository.checkUserSubscriptionAccess(id, userId);
    if (!hasAccess) {
      throw new Error('User does not have access to this subscription');
    }
    
    // Get the existing subscription
    const subscription = await this.subscriptionRepository.getSubscriptionById(id);
    if (!subscription) return null;
    
    // If changing plans, validate the new plan exists
    if (request.planId && request.planId !== subscription.planId) {
      const newPlan = await this.planRepository.getPlanById(request.planId);
      if (!newPlan) {
        throw new Error('New plan not found');
      }
    }
    
    // Build update data
    const updateData: Partial<Subscription> = {
      ...request,
      updatedAt: Date.now()
    };
    
    // Update the subscription
    return this.subscriptionRepository.updateSubscription(id, updateData);
  }

  async cancelSubscription(id: string, userId: string): Promise<Subscription | null> {
    // Check if the user has access to this subscription
    const hasAccess = await this.subscriptionRepository.checkUserSubscriptionAccess(id, userId);
    if (!hasAccess) {
      throw new Error('User does not have access to this subscription');
    }
    
    // Get the existing subscription
    const subscription = await this.subscriptionRepository.getSubscriptionById(id);
    if (!subscription) return null;
    
    // If the subscription is already cancelled, return it as is
    if (subscription.status === 'cancelled') {
      return subscription;
    }
    
    const now = Date.now();
    
    // Update the subscription to cancelled status
    const updateData: Partial<Subscription> = {
      status: 'cancelled',
      cancelAt: now,
      updatedAt: now
    };
    
    // Update the subscription
    return this.subscriptionRepository.updateSubscription(id, updateData);
  }
}