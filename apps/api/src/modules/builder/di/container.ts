import { CloudflareKVStore, KeyValueStore } from '../../../database/kvStore';
import { Env } from '../../../types';
import { PageSettingsDefinitionRepository } from '../repositories/PageSettingsDefinitionRepository';
import { PredefinedContentBlockRepository } from '../repositories/PredefinedContentBlockRepository';
import { PageSettingsDefinitionService } from '../services/PageSettingsDefinitionService';
import { PredefinedContentBlockService } from '../services/PredefinedContentBlockService';

/**
 * Type for the builder module's dependency container
 * Maps service names to their singleton instances
 */
type BuilderContainer = {
  kvStore: KeyValueStore;
  predefinedContentBlockRepository: PredefinedContentBlockRepository;
  pageSettingsDefinitionRepository: PageSettingsDefinitionRepository;
  predefinedContentBlockService: PredefinedContentBlockService;
  pageSettingsDefinitionService: PageSettingsDefinitionService;
};

/**
 * Simple dependency injection container for the builder module
 * Creates and manages singleton instances of services
 */
export class Container {
  private static instance: Container;
  private services: Partial<BuilderContainer> = {};
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
      // Create and register KV store
      const kvStore = new CloudflareKVStore(env.BUILDER_KV);
      this.services.kvStore = kvStore;

      // Create and register repositories
      const predefinedContentBlockRepository = new PredefinedContentBlockRepository(kvStore);
      const pageSettingsDefinitionRepository = new PageSettingsDefinitionRepository(kvStore);
      this.services.predefinedContentBlockRepository = predefinedContentBlockRepository;
      this.services.pageSettingsDefinitionRepository = pageSettingsDefinitionRepository;

      // Create and register services
      const predefinedContentBlockService = new PredefinedContentBlockService(
        predefinedContentBlockRepository
      );
      const pageSettingsDefinitionService = new PageSettingsDefinitionService(
        pageSettingsDefinitionRepository
      );
      this.services.predefinedContentBlockService = predefinedContentBlockService;
      this.services.pageSettingsDefinitionService = pageSettingsDefinitionService;
    }
  }

  /**
   * Gets a service instance by name
   * @param serviceName The name of the service to retrieve
   * @returns The service instance
   */
  public get<K extends keyof BuilderContainer>(serviceName: K): BuilderContainer[K] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found or not initialized`);
    }
    return service as BuilderContainer[K];
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
 * Factory function to get the container instance
 * @param env Cloudflare Workers environment
 * @returns The singleton container instance
 */
const getContainer = (env: Env): Container => {
  const container = Container.getInstance();
  container.initialize(env);
  return container;
};

/**
 * Helper function to get a service from the container
 * @param env Cloudflare Workers environment
 * @param serviceName The name of the service to retrieve
 * @returns The service instance
 */
export const getService = <K extends keyof BuilderContainer>(
  env: Env,
  serviceName: K
): BuilderContainer[K] => {
  return getContainer(env).get(serviceName);
};
