import { RequestContext } from '../../../database/databaseService';
import {
  Page,
  PageVersion,
  CreatePageRequest,
  SavePageDraftRequest,
  PublishPageRequest,
  PageWithVersion,
  ExpirationSetting,
} from '../models/schemas';

export interface IPageService {
  createPage(data: CreatePageRequest, context?: RequestContext): Promise<Page>;
  getPageById(id: number): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  getPageWithVersionDetails(
    pageId: number | string,
    languageCode: string
  ): Promise<PageWithVersion | null>;
  getPageBySlugWithVersionDetails(
    slug: string,
    languageCode: string
  ): Promise<PageWithVersion | null>;
  savePageDraft(data: SavePageDraftRequest, context?: RequestContext): Promise<PageVersion>;
  publishPage(data: PublishPageRequest, context?: RequestContext): Promise<PageVersion>;
  deletePage(id: number, context?: RequestContext): Promise<boolean>;
}

export interface IExpirationService {
  createExpirationSetting(
    expirationType: 'datetime' | 'duration',
    expiresAtDatetime: number | null,
    durationSeconds: number | null,
    expirationAction: 'unpublish' | 'redirect',
    redirectUrl: string | null,
    context?: RequestContext
  ): Promise<ExpirationSetting>;

  getExpirationSettingById(id: number): Promise<ExpirationSetting | null>;

  updateExpirationSetting(
    id: number,
    updates: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null>;

  deleteExpirationSetting(id: number, context?: RequestContext): Promise<boolean>;

  processExpirations(): Promise<void>;
}
