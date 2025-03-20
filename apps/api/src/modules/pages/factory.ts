import { Env } from './../../types';
import { ContentBlockRepository } from './repositories/contentBlockRepository';
import { ContentBlockTranslationRepository } from './repositories/contentBlockTranslationRepository';
import { ExpirationSettingRepository } from './repositories/expirationSettingRepository';
import {
  IPageRepository,
  IPageVersionRepository,
  IPageVersionTranslationRepository,
  IContentBlockRepository,
  IContentBlockTranslationRepository,
  IExpirationSettingRepository,
} from './repositories/interfaces';
import { PageRepository } from './repositories/pageRepository';
import { PageVersionRepository } from './repositories/pageVersionRepository';
import { PageVersionTranslationRepository } from './repositories/pageVersionTranslationRepository';
import { ExpirationService } from './services/expirationService';
import { IPageService, IExpirationService } from './services/interfaces';
import { PageService } from './services/pageService';

/**
 * Factory functions for creating service instances
 */

/**
 * Create a contentBlockRepository instance
 */
export function createContentBlockRepository(env: Env): ContentBlockRepository {
  return new ContentBlockRepository(env);
}

/**
 * Create a contentBlockTranslationRepository instance
 */
export function createContentBlockTranslationRepository(env: Env): ContentBlockTranslationRepository {
  return new ContentBlockTranslationRepository(env);
}

/**
 * Create a expirationSettingRepository instance
 */
export function createExpirationSettingRepository(env: Env): ExpirationSettingRepository {
  return new ExpirationSettingRepository(env);
}

/**
 * Create a pageRepository instance
 */
export function createPageRepository(env: Env): IPageRepository {
  return new PageRepository(env);
}

/**
 * Create a pageVersionRepository instance
 */
export function createPageVersionRepository(env: Env): IPageVersionRepository {
  return new PageVersionRepository(env);
}

/**
 * Create a pageVersionTranslationRepository instance
 */
export function createPageVersionTranslationRepository(env: Env): IPageVersionTranslationRepository {
  return new PageVersionTranslationRepository(env);
}

/**
 * Create a expirationService instance
 */
export function createExpirationService(env: Env): IExpirationService {
  const expirationSettingRepository = createExpirationSettingRepository(env);
  const pageRepository = createPageRepository(env);
  const pageVersionRepository = createPageVersionRepository(env);
  return new ExpirationService(expirationSettingRepository, pageRepository, pageVersionRepository);
}

/**
 * Create a pageService instance
 */
export function createPageService(env: Env): IPageService {
  const pageRepository = createPageRepository(env);
  const pageVersionRepository = createPageVersionRepository(env);
  const pageVersionTranslationRepository = createPageVersionTranslationRepository(env);
  const contentBlockRepository = createContentBlockRepository(env);
  const contentBlockTranslationRepository = createContentBlockTranslationRepository(env);
  const expirationSettingRepository = createExpirationSettingRepository(env);
  return new PageService(pageRepository, pageVersionRepository, pageVersionTranslationRepository, contentBlockRepository, contentBlockTranslationRepository, expirationSettingRepository);
}