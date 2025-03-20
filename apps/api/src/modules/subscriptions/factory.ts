import { Env } from './../../types';
import { PlanRepository } from './repositories/planRepository';
import { SubscriptionRepository } from './repositories/subscriptionRepository';
import {
  IPlanRepository,
  IPlanService,
  ISubscriptionRepository,
  ISubscriptionService,
  IStripeService,
} from './services/interfaces';
import { PlanService } from './services/planService';
import { StripeService } from './services/stripeService';
import { SubscriptionService } from './services/subscriptionService';

/**
 * Factory functions for creating service instances
 */

/**
 * Create a planRepository instance
 */
export function createPlanRepository(env: Env): PlanRepository {
  return new PlanRepository(env);
}

/**
 * Create a subscriptionRepository instance
 */
export function createSubscriptionRepository(env: Env): SubscriptionRepository {
  return new SubscriptionRepository(env);
}

/**
 * Create a iStripeService instance
 */
export function createIStripeService(env: Env): IStripeService {
  return new StripeService(env);
}

/**
 * Create a planService instance
 */
export function createPlanService(env: Env): PlanService {
  const planRepository = createPlanRepository(env);
  return new PlanService(planRepository);
}

/**
 * Create a stripeService instance
 */
export function createStripeService(env: Env): StripeService {
  return new StripeService(env);
}

/**
 * Create a subscriptionService instance
 */
export function createSubscriptionService(env: Env): SubscriptionService {
  const subscriptionRepository = createSubscriptionRepository(env);
  const planRepository = createPlanRepository(env);
  return new SubscriptionService(subscriptionRepository, planRepository);
}
