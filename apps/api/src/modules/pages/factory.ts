import { createDatabase } from '@/database/databaseFactory';

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
  const dbService = createDatabase(env);
  return new ContentBlockRepository(dbService);
}

/**
 * Create a contentBlockTranslationRepository instance
 */
export function createContentBlockTranslationRepository(
  env: Env
): ContentBlockTranslationRepository {
  const dbService = createDatabase(env);
  return new ContentBlockTranslationRepository(dbService);
}

/**
 * Create a expirationSettingRepository instance
 */
export function createExpirationSettingRepository(env: Env): ExpirationSettingRepository {
  const dbService = createDatabase(env);
  return new ExpirationSettingRepository(dbService);
}

/**
 * Create a pageRepository instance
 */
export function createPageRepository(env: Env): IPageRepository {
  const dbService = createDatabase(env);
  return new PageRepository(dbService);
}

/**
 * Create a pageVersionRepository instance
 */
export function createPageVersionRepository(env: Env): IPageVersionRepository {
  const dbService = createDatabase(env);
  return new PageVersionRepository(dbService);
}

/**
 * Create a pageVersionTranslationRepository instance
 */
export function createPageVersionTranslationRepository(
  env: Env
): IPageVersionTranslationRepository {
  const dbService = createDatabase(env);
  return new PageVersionTranslationRepository(dbService);
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
  return new PageService(
    pageRepository,
    pageVersionRepository,
    pageVersionTranslationRepository,
    contentBlockRepository,
    contentBlockTranslationRepository,
    expirationSettingRepository
  );
}
