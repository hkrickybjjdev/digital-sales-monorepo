import { Env } from '../../../types';
import { PlanRepository } from '../repositories/planRepository';
import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import {
  IPlanRepository,
  IPlanService,
  ISubscriptionRepository,
  ISubscriptionService,
  IStripeService,
} from '../services/interfaces';
import { PlanService } from '../services/planService';
import { StripeService } from '../services/stripeService';
import { SubscriptionService } from '../services/subscriptionService';

/**
 * Interface for the subscriptions module's DI container
 */
export interface SubscriptionsContainer {
  // Repositories
  planRepository: IPlanRepository;
  subscriptionRepository: ISubscriptionRepository;

  // Services
  planService: IPlanService;
  subscriptionService: ISubscriptionService;
  stripeService: IStripeService;
}

// Singleton instances
let planRepositoryInstance: IPlanRepository | null = null;
let subscriptionRepositoryInstance: ISubscriptionRepository | null = null;
let planServiceInstance: IPlanService | null = null;
let subscriptionServiceInstance: ISubscriptionService | null = null;
let stripeServiceInstance: IStripeService | null = null;
let containerEnv: Env | null = null;

/**
 * Returns a container with all the subscriptions module dependencies
 * Uses singleton pattern for stateless services
 */
export function getSubscriptionsContainer(env: Env): SubscriptionsContainer {
  // If environment changes, reset instances
  if (containerEnv && containerEnv !== env) {
    resetSubscriptionsContainer();
  }

  containerEnv = env;

  // Create repositories if they don't exist
  if (!planRepositoryInstance) {
    planRepositoryInstance = new PlanRepository(env.DB);
  }

  if (!subscriptionRepositoryInstance) {
    subscriptionRepositoryInstance = new SubscriptionRepository(env.DB);
  }

  // Create services if they don't exist
  if (!planServiceInstance) {
    planServiceInstance = new PlanService(planRepositoryInstance);
  }

  if (!subscriptionServiceInstance) {
    subscriptionServiceInstance = new SubscriptionService(
      subscriptionRepositoryInstance,
      planRepositoryInstance
    );
  }

  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService(env);
  }

  // Return the container with all dependencies
  return {
    planRepository: planRepositoryInstance,
    subscriptionRepository: subscriptionRepositoryInstance,
    planService: planServiceInstance,
    subscriptionService: subscriptionServiceInstance,
    stripeService: stripeServiceInstance,
  };
}

/**
 * For testing purposes - allows resetting the singletons
 */
export function resetSubscriptionsContainer(): void {
  planRepositoryInstance = null;
  subscriptionRepositoryInstance = null;
  planServiceInstance = null;
  subscriptionServiceInstance = null;
  stripeServiceInstance = null;
  containerEnv = null;
}
