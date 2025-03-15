import { 
  Plan, 
  PlanWithPrices,
  Price, 
  Subscription,
  SubscriptionWithPlan,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest
} from '../models/schemas';
import Stripe from 'stripe';

/**
 * Interface for PlanService
 */
export interface IPlanService {
  /**
   * Get all visible plans
   */
  getPlans(): Promise<PlanWithPrices[]>;
  
  /**
   * Get a plan by ID
   */
  getPlanById(id: string): Promise<PlanWithPrices | null>;
}

/**
 * Interface for SubscriptionService
 */
export interface ISubscriptionService {
  /**
   * Create a new subscription
   */
  createSubscription(userId: string, request: CreateSubscriptionRequest): Promise<Subscription>;
  
  /**
   * Get a subscription by ID
   */
  getSubscriptionById(id: string, userId: string): Promise<SubscriptionWithPlan | null>;
  
  /**
   * Get all subscriptions for a team
   */
  getTeamSubscriptions(teamId: string, userId: string): Promise<SubscriptionWithPlan[]>;
  
  /**
   * Update a subscription
   */
  updateSubscription(id: string, userId: string, request: UpdateSubscriptionRequest): Promise<Subscription | null>;
  
  /**
   * Cancel a subscription
   */
  cancelSubscription(id: string, userId: string): Promise<Subscription | null>;
}

/**
 * Interface for PlanRepository
 */
export interface IPlanRepository {
  /**
   * Get all plans
   */
  getPlans(visibleOnly: boolean): Promise<Plan[]>;
  
  /**
   * Get a plan by ID
   */
  getPlanById(id: string): Promise<Plan | null>;
  
  /**
   * Get prices for a plan
   */
  getPricesForPlan(planId: string): Promise<Price[]>;
}

/**
 * Interface for SubscriptionRepository
 */
export interface ISubscriptionRepository {
  /**
   * Create a new subscription
   */
  createSubscription(subscription: Subscription): Promise<Subscription>;
  
  /**
   * Get a subscription by ID
   */
  getSubscriptionById(id: string): Promise<Subscription | null>;
  
  /**
   * Get all subscriptions for a team
   */
  getTeamSubscriptions(teamId: string): Promise<Subscription[]>;
  
  /**
   * Update a subscription
   */
  updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription | null>;
  
  /**
   * Check if user has access to subscription (via team membership)
   */
  checkUserSubscriptionAccess(subscriptionId: string, userId: string): Promise<boolean>;

  /**
   * Check if user has access to team
   */
  checkUserTeamAccess(teamId: string, userId: string): Promise<boolean>;

  /**
   * Find subscriptions by Stripe subscription ID
   */
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription[]>;
}

export interface IPriceRepository {

  /**
   * Get Prices By Plan Id
   */
  getPricesByPlanId(planId: string): Promise<Price[]>;


  /**
   * Get Price By Id
   */
  getPriceById(id: string): Promise<Price | null>;
}

export interface IStripeService {
  /**
   * Create a checkout session for subscription
   */
  createCheckoutSession(options: {
    teamId: string;
    lookupKey: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  /**
   * Create a billing portal session
   */
  createPortalSession(options: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  /**
   * Retrieve a checkout session
   */
  retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event;
}