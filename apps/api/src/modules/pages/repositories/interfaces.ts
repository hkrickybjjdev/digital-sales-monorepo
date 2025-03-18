import { DatabaseService, RequestContext } from '../../../database/databaseService';
import {
  Page,
  PageVersion,
  PageVersionTranslation,
  ContentBlock,
  ContentBlockTranslation,
  ExpirationSetting,
} from '../models/schemas';

export interface IPageRepository {
  createPage(
    page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<Page>;
  getPageById(id: string): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  updatePage(id: string, page: Partial<Page>, context?: RequestContext): Promise<Page | null>;
  deletePage(id: string, context?: RequestContext): Promise<boolean>;
}

export interface IPageVersionRepository {
  createPageVersion(
    pageVersion: Omit<PageVersion, 'id' | 'createdAt'>,
    context?: RequestContext
  ): Promise<PageVersion>;
  getPageVersionById(id: string): Promise<PageVersion | null>;
  getLatestPageVersion(pageId: string): Promise<PageVersion | null>;
  getPublishedPageVersion(pageId: string): Promise<PageVersion | null>;
  getPublishedVersionsWithExpirations(): Promise<PageVersion[]>;
  updatePageVersion(
    id: string,
    pageVersion: Partial<PageVersion>,
    context?: RequestContext
  ): Promise<PageVersion | null>;
  unpublishAllVersionsExcept(
    pageId: string,
    versionId: string,
    context?: RequestContext
  ): Promise<boolean>;
  deletePageVersionsByPageId(pageId: string, context?: RequestContext): Promise<boolean>;
}

export interface IPageVersionTranslationRepository {
  createPageVersionTranslation(
    translation: Omit<PageVersionTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<PageVersionTranslation>;
  getPageVersionTranslationById(id: string): Promise<PageVersionTranslation | null>;
  getPageVersionTranslationsByVersionId(
    versionId: string
  ): Promise<Record<string, PageVersionTranslation>>;
  getPageVersionTranslation(
    versionId: string,
    languageCode: string
  ): Promise<PageVersionTranslation | null>;
  updatePageVersionTranslation(
    id: string,
    translation: Partial<PageVersionTranslation>,
    context?: RequestContext
  ): Promise<PageVersionTranslation | null>;
  deletePageVersionTranslationsByVersionId(
    versionId: string,
    context?: RequestContext
  ): Promise<boolean>;
}

export interface IContentBlockRepository {
  createContentBlock(
    contentBlock: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlock>;
  getContentBlockById(id: string): Promise<ContentBlock | null>;
  getContentBlocksByVersionId(versionId: string, onlyLive?: boolean): Promise<ContentBlock[]>;
  updateContentBlock(
    id: string,
    contentBlock: Partial<ContentBlock>,
    context?: RequestContext
  ): Promise<ContentBlock | null>;
  deleteContentBlock(id: string, context?: RequestContext): Promise<boolean>;
  deleteContentBlocksByVersionId(versionId: string, context?: RequestContext): Promise<boolean>;
}

export interface IContentBlockTranslationRepository {
  createContentBlockTranslation(
    translation: Omit<ContentBlockTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation>;
  getContentBlockTranslationById(id: string): Promise<ContentBlockTranslation | null>;
  getContentBlockTranslationsByContentBlockIds(
    contentBlockIds: string[]
  ): Promise<Record<string, Record<string, ContentBlockTranslation>>>;
  getContentBlockTranslation(
    contentBlockId: string,
    languageCode: string
  ): Promise<ContentBlockTranslation | null>;
  updateContentBlockTranslation(
    id: string,
    translation: Partial<ContentBlockTranslation>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation | null>;
  deleteContentBlockTranslationsByContentBlockId(
    contentBlockId: string,
    context?: RequestContext
  ): Promise<boolean>;
}

export interface IExpirationSettingRepository {
  createExpirationSetting(
    setting: Omit<ExpirationSetting, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ExpirationSetting>;
  getExpirationSettingById(id: string): Promise<ExpirationSetting | null>;
  updateExpirationSetting(
    id: string,
    setting: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null>;
  deleteExpirationSetting(id: string, context?: RequestContext): Promise<boolean>;
}
