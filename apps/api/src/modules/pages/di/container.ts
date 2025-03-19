import { Env } from '../../../types';
import { ContentBlockRepository } from '../repositories/contentBlockRepository';
import { ContentBlockTranslationRepository } from '../repositories/contentBlockTranslationRepository';
import { ExpirationSettingRepository } from '../repositories/expirationSettingRepository';
import {
  IPageRepository,
  IPageVersionRepository,
  IPageVersionTranslationRepository,
  IContentBlockRepository,
  IContentBlockTranslationRepository,
  IExpirationSettingRepository,
} from '../repositories/interfaces';
import { PageRepository } from '../repositories/pageRepository';
import { PageVersionRepository } from '../repositories/pageVersionRepository';
import { PageVersionTranslationRepository } from '../repositories/pageVersionTranslationRepository';
import { ExpirationService } from '../services/expirationService';
import { IPageService, IExpirationService } from '../services/interfaces';
import { PageService } from '../services/pageService';

// Define the shape of our container
interface PagesContainer {
  // Repositories
  pageRepository: IPageRepository;
  pageVersionRepository: IPageVersionRepository;
  pageVersionTranslationRepository: IPageVersionTranslationRepository;
  contentBlockRepository: IContentBlockRepository;
  contentBlockTranslationRepository: IContentBlockTranslationRepository;
  expirationSettingRepository: IExpirationSettingRepository;

  // Services
  pageService: IPageService;
  expirationService: IExpirationService;
}

/**
 * Class-based dependency injection container for the pages module
 * Creates and manages singleton instances of services
 */
export class Container {
  private static instance: Container;
  private services: Partial<PagesContainer> = {};
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
      // Create repository instances
      const pageRepository = new PageRepository(env);
      const pageVersionRepository = new PageVersionRepository(env);
      const pageVersionTranslationRepository = new PageVersionTranslationRepository(env);
      const contentBlockRepository = new ContentBlockRepository(env);
      const contentBlockTranslationRepository = new ContentBlockTranslationRepository(env);
      const expirationSettingRepository = new ExpirationSettingRepository(env);

      // Create service instances
      const pageService = new PageService(
        pageRepository,
        pageVersionRepository,
        pageVersionTranslationRepository,
        contentBlockRepository,
        contentBlockTranslationRepository,
        expirationSettingRepository
      );

      const expirationService = new ExpirationService(
        expirationSettingRepository,
        pageRepository,
        pageVersionRepository
      );

      // Register all services and repositories
      this.services.pageRepository = pageRepository;
      this.services.pageVersionRepository = pageVersionRepository;
      this.services.pageVersionTranslationRepository = pageVersionTranslationRepository;
      this.services.contentBlockRepository = contentBlockRepository;
      this.services.contentBlockTranslationRepository = contentBlockTranslationRepository;
      this.services.expirationSettingRepository = expirationSettingRepository;
      this.services.pageService = pageService;
      this.services.expirationService = expirationService;
    }
  }

  /**
   * Gets a service instance by name
   * @param serviceName The name of the service to retrieve
   * @returns The service instance
   */
  public get<K extends keyof PagesContainer>(serviceName: K): PagesContainer[K] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found or not initialized`);
    }
    return service as PagesContainer[K];
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
 * Factory function to get the pages container
 * @param env Cloudflare Workers environment
 * @returns The initialized pages container
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
export function getService<K extends keyof PagesContainer>(
  env: Env,
  serviceName: K
): PagesContainer[K] {
  return getContainer(env).get(serviceName);
}
