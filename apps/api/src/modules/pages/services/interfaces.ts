import { RequestContext } from '../../../database/sqlDatabase';
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
  getPageById(id: string): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  getPageWithVersionDetails(pageId: string, languageCode: string): Promise<PageWithVersion | null>;
  getPageBySlugWithVersionDetails(
    slug: string,
    languageCode: string
  ): Promise<PageWithVersion | null>;
  savePageDraft(data: SavePageDraftRequest, context?: RequestContext): Promise<PageVersion>;
  publishPage(data: PublishPageRequest, context?: RequestContext): Promise<PageVersion>;
  deletePage(id: string, context?: RequestContext): Promise<boolean>;
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

  getExpirationSettingById(id: string): Promise<ExpirationSetting | null>;

  updateExpirationSetting(
    id: string,
    updates: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null>;

  deleteExpirationSetting(id: string, context?: RequestContext): Promise<boolean>;

  processExpirations(): Promise<void>;
}
