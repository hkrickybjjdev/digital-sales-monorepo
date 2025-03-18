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

// In-memory singleton instances
let pageRepositoryInstance: IPageRepository | null = null;
let pageVersionRepositoryInstance: IPageVersionRepository | null = null;
let pageVersionTranslationRepositoryInstance: IPageVersionTranslationRepository | null = null;
let contentBlockRepositoryInstance: IContentBlockRepository | null = null;
let contentBlockTranslationRepositoryInstance: IContentBlockTranslationRepository | null = null;
let expirationSettingRepositoryInstance: IExpirationSettingRepository | null = null;
let pageServiceInstance: IPageService | null = null;
let expirationServiceInstance: IExpirationService | null = null;
let containerEnv: Env | null = null;

/**
 * Returns a container with all the Pages module dependencies
 * Uses singleton pattern for stateless services
 */
export function getPagesContainer(env: Env): PagesContainer {
  // If environment changes, recreate all instances
  if (containerEnv && env !== containerEnv) {
    resetPagesContainer();
  }

  // Store current environment
  containerEnv = env;

  // Create repository instances if they don't exist
  if (!pageRepositoryInstance) {
    pageRepositoryInstance = new PageRepository(env);
  }

  if (!pageVersionRepositoryInstance) {
    pageVersionRepositoryInstance = new PageVersionRepository(env);
  }

  if (!pageVersionTranslationRepositoryInstance) {
    pageVersionTranslationRepositoryInstance = new PageVersionTranslationRepository(env);
  }

  if (!contentBlockRepositoryInstance) {
    contentBlockRepositoryInstance = new ContentBlockRepository(env);
  }

  if (!contentBlockTranslationRepositoryInstance) {
    contentBlockTranslationRepositoryInstance = new ContentBlockTranslationRepository(env);
  }

  if (!expirationSettingRepositoryInstance) {
    expirationSettingRepositoryInstance = new ExpirationSettingRepository(env);
  }

  // Create service instances if they don't exist
  if (!pageServiceInstance) {
    pageServiceInstance = new PageService(
      pageRepositoryInstance,
      pageVersionRepositoryInstance,
      pageVersionTranslationRepositoryInstance,
      contentBlockRepositoryInstance,
      contentBlockTranslationRepositoryInstance,
      expirationSettingRepositoryInstance
    );
  }

  if (!expirationServiceInstance) {
    expirationServiceInstance = new ExpirationService(
      expirationSettingRepositoryInstance,
      pageRepositoryInstance,
      pageVersionRepositoryInstance
    );
  }

  return {
    // Repositories
    pageRepository: pageRepositoryInstance,
    pageVersionRepository: pageVersionRepositoryInstance,
    pageVersionTranslationRepository: pageVersionTranslationRepositoryInstance,
    contentBlockRepository: contentBlockRepositoryInstance,
    contentBlockTranslationRepository: contentBlockTranslationRepositoryInstance,
    expirationSettingRepository: expirationSettingRepositoryInstance,

    // Services
    pageService: pageServiceInstance,
    expirationService: expirationServiceInstance,
  };
}

/**
 * Reset all container instances
 * Useful for testing and when environment changes
 */
export function resetPagesContainer(): void {
  pageRepositoryInstance = null;
  pageVersionRepositoryInstance = null;
  pageVersionTranslationRepositoryInstance = null;
  contentBlockRepositoryInstance = null;
  contentBlockTranslationRepositoryInstance = null;
  expirationSettingRepositoryInstance = null;
  pageServiceInstance = null;
  expirationServiceInstance = null;
  containerEnv = null;
}
