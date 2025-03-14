import { PageRepository } from '../repositories/pageRepository';
import { ContentRepository } from '../repositories/contentRepository';
import { RegistrationRepository } from '../repositories/registrationRepository';
import { PageService } from '../services/PageService';
import { ContentService } from '../services/ContentService';
import { RegistrationService } from '../services/RegistrationService';
import { PageCacheService } from '../services/cache';
import { Env } from '../../../types';
import {
  IPageRepository,
  IContentRepository,
  IRegistrationRepository,
  IPageService,
  IContentService,
  IRegistrationService,
  IPageCacheService
} from '../services/interfaces';

/**
 * Interface for the pages module's DI container
 */
export interface PagesContainer {
  // Repositories
  pageRepository: IPageRepository;
  contentRepository: IContentRepository;
  registrationRepository: IRegistrationRepository;
  
  // Services
  pageService: IPageService;
  contentService: IContentService;
  registrationService: IRegistrationService;
  pageCacheService: IPageCacheService;
}

// Singleton instances with their associated environment
let pageRepositoryInstance: PageRepository | null = null;
let contentRepositoryInstance: ContentRepository | null = null;
let registrationRepositoryInstance: RegistrationRepository | null = null;

let pageServiceInstance: PageService | null = null;
let contentServiceInstance: ContentService | null = null;
let registrationServiceInstance: RegistrationService | null = null;
let pageCacheServiceInstance: PageCacheService | null = null;

let containerEnv: Env | null = null;

/**
 * Factory function to create the pages container
 */
export function getPagesContainer(env: Env): PagesContainer {
  // If environment changes, recreate the instances to ensure consistency
  if (containerEnv && env !== containerEnv) {
    resetPagesContainer();
  }
  
  // Store the current environment
  containerEnv = env;
  
  // Create repositories as singletons
  if (!pageRepositoryInstance) {
    pageRepositoryInstance = new PageRepository(env.DB);
  }
  
  if (!contentRepositoryInstance) {
    contentRepositoryInstance = new ContentRepository(env.DB);
  }
  
  if (!registrationRepositoryInstance) {
    registrationRepositoryInstance = new RegistrationRepository(env.DB);
  }
  
  // Create services with their dependencies as singletons
  if (!pageCacheServiceInstance) {
    pageCacheServiceInstance = new PageCacheService(env.PAGES_METADATA);
  }
  
  if (!pageServiceInstance) {
    pageServiceInstance = new PageService(env.DB, env.PAGES_METADATA);
  }
  
  if (!contentServiceInstance) {
    contentServiceInstance = new ContentService(env.DB);
  }
  
  if (!registrationServiceInstance) {
    registrationServiceInstance = new RegistrationService(env.DB);
  }
  
  return {
    // Repositories
    pageRepository: pageRepositoryInstance,
    contentRepository: contentRepositoryInstance,
    registrationRepository: registrationRepositoryInstance,
    
    // Services
    pageService: pageServiceInstance,
    contentService: contentServiceInstance,
    registrationService: registrationServiceInstance,
    pageCacheService: pageCacheServiceInstance
  };
}

/**
 * For testing purposes - allows resetting the singletons
 */
export function resetPagesContainer(): void {
  pageRepositoryInstance = null;
  contentRepositoryInstance = null;
  registrationRepositoryInstance = null;
  
  pageServiceInstance = null;
  contentServiceInstance = null;
  registrationServiceInstance = null;
  pageCacheServiceInstance = null;
  
  containerEnv = null;
}