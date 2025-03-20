import { CloudflareKVStore } from '../../database/kvStore';

import { Env } from './../../types';
import { PageSettingsDefinitionRepository } from './repositories/PageSettingsDefinitionRepository';
import { PredefinedContentBlockRepository } from './repositories/PredefinedContentBlockRepository';
import { PageSettingsDefinitionService } from './services/PageSettingsDefinitionService';
import { PredefinedContentBlockService } from './services/PredefinedContentBlockService';

/**
 * Factory functions for creating service instances
 */

/**
 * Create a pageSettingsDefinitionRepository instance
 */
export function createPageSettingsDefinitionRepository(env: Env): PageSettingsDefinitionRepository {
  const kvStore = new CloudflareKVStore(env.BUILDER_KV);
  return new PageSettingsDefinitionRepository(kvStore);
}

/**
 * Create a predefinedContentBlockRepository instance
 */
export function createPredefinedContentBlockRepository(env: Env): PredefinedContentBlockRepository {
  const kvStore = new CloudflareKVStore(env.BUILDER_KV);
  return new PredefinedContentBlockRepository(kvStore);
}

/**
 * Create a pageSettingsDefinitionService instance
 */
export function createPageSettingsDefinitionService(env: Env): PageSettingsDefinitionService {
  const repository = createPageSettingsDefinitionRepository(env);
  return new PageSettingsDefinitionService(repository);
}

/**
 * Create a predefinedContentBlockService instance
 */
export function createPredefinedContentBlockService(env: Env): PredefinedContentBlockService {
  const repository = createPredefinedContentBlockRepository(env);
  return new PredefinedContentBlockService(repository);
}
