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

/**
 * Class-based dependency injection container for the subscriptions module
 * Creates and manages singleton instances of services
 */
export class Container {
  private static instance: Container;
  private services: Partial<SubscriptionsContainer> = {};
  private env: Env | null = null;

  private constructor() {}

  /**
   * Gets the singleton container instance
   * @returns The container instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initializes the container with environment variables
   * @param env Cloudflare Workers environment
   */
  public initialize(env: Env): void {
    // If environment changes, reset the container
    if (this.env && this.env !== env) {
      this.clear();
    }
    
    // Store current environment
    this.env = env;

    // Only initialize services if they haven't been created yet
    if (Object.keys(this.services).length === 0) {
      // Create repositories
      const planRepository = new PlanRepository(env);
      const subscriptionRepository = new SubscriptionRepository(env);

      // Create services
      const planService = new PlanService(planRepository);
      const subscriptionService = new SubscriptionService(
        subscriptionRepository,
        planRepository
      );
      const stripeService = new StripeService(env);

      // Register all services
      this.services.planRepository = planRepository;
      this.services.subscriptionRepository = subscriptionRepository;
      this.services.planService = planService;
      this.services.subscriptionService = subscriptionService;
      this.services.stripeService = stripeService;
    }
  }

  /**
   * Gets a service instance by name
   * @param serviceName The name of the service to retrieve
   * @returns The service instance
   */
  public get<K extends keyof SubscriptionsContainer>(serviceName: K): SubscriptionsContainer[K] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found or not initialized`);
    }
    return service as SubscriptionsContainer[K];
  }

  /**
   * For testing: clear all services and reset the container
   */
  public clear(): void {
    this.services = {};
    this.env = null;
  }
}

/**
 * Factory function to get the subscriptions container
 * @param env Cloudflare Workers environment
 * @returns The initialized subscriptions container
 */
function getContainer(env: Env): Container {
  const container = Container.getInstance();
  container.initialize(env);
  return container;
}

/**
 * Helper function to get a service from the container
 * @param env Cloudflare Workers environment
 * @param serviceName The name of the service to retrieve
 * @returns The service instance
 */
export function getService<K extends keyof SubscriptionsContainer>(
  env: Env,
  serviceName: K
): SubscriptionsContainer[K] {
  return getContainer(env).get(serviceName);
}
