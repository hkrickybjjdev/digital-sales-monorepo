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
  getPageById(id: number): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  updatePage(id: number, page: Partial<Page>, context?: RequestContext): Promise<Page | null>;
  deletePage(id: number, context?: RequestContext): Promise<boolean>;
}

export interface IPageVersionRepository {
  createPageVersion(
    pageVersion: Omit<PageVersion, 'id' | 'createdAt'>,
    context?: RequestContext
  ): Promise<PageVersion>;
  getPageVersionById(id: number): Promise<PageVersion | null>;
  getLatestPageVersion(pageId: number): Promise<PageVersion | null>;
  getPublishedPageVersion(pageId: number): Promise<PageVersion | null>;
  getPublishedVersionsWithExpirations(): Promise<PageVersion[]>;
  updatePageVersion(
    id: number,
    pageVersion: Partial<PageVersion>,
    context?: RequestContext
  ): Promise<PageVersion | null>;
  unpublishAllVersionsExcept(
    pageId: number,
    versionId: number,
    context?: RequestContext
  ): Promise<boolean>;
  deletePageVersionsByPageId(pageId: number, context?: RequestContext): Promise<boolean>;
}

export interface IPageVersionTranslationRepository {
  createPageVersionTranslation(
    translation: Omit<PageVersionTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<PageVersionTranslation>;
  getPageVersionTranslationById(id: number): Promise<PageVersionTranslation | null>;
  getPageVersionTranslationsByVersionId(
    versionId: number
  ): Promise<Record<string, PageVersionTranslation>>;
  getPageVersionTranslation(
    versionId: number,
    languageCode: string
  ): Promise<PageVersionTranslation | null>;
  updatePageVersionTranslation(
    id: number,
    translation: Partial<PageVersionTranslation>,
    context?: RequestContext
  ): Promise<PageVersionTranslation | null>;
  deletePageVersionTranslationsByVersionId(
    versionId: number,
    context?: RequestContext
  ): Promise<boolean>;
}

export interface IContentBlockRepository {
  createContentBlock(
    contentBlock: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlock>;
  getContentBlockById(id: number): Promise<ContentBlock | null>;
  getContentBlocksByVersionId(versionId: number, onlyLive?: boolean): Promise<ContentBlock[]>;
  updateContentBlock(
    id: number,
    contentBlock: Partial<ContentBlock>,
    context?: RequestContext
  ): Promise<ContentBlock | null>;
  deleteContentBlock(id: number, context?: RequestContext): Promise<boolean>;
  deleteContentBlocksByVersionId(versionId: number, context?: RequestContext): Promise<boolean>;
}

export interface IContentBlockTranslationRepository {
  createContentBlockTranslation(
    translation: Omit<ContentBlockTranslation, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation>;
  getContentBlockTranslationById(id: number): Promise<ContentBlockTranslation | null>;
  getContentBlockTranslationsByContentBlockIds(
    contentBlockIds: number[]
  ): Promise<Record<number, Record<string, ContentBlockTranslation>>>;
  getContentBlockTranslation(
    contentBlockId: number,
    languageCode: string
  ): Promise<ContentBlockTranslation | null>;
  updateContentBlockTranslation(
    id: number,
    translation: Partial<ContentBlockTranslation>,
    context?: RequestContext
  ): Promise<ContentBlockTranslation | null>;
  deleteContentBlockTranslationsByContentBlockId(
    contentBlockId: number,
    context?: RequestContext
  ): Promise<boolean>;
}

export interface IExpirationSettingRepository {
  createExpirationSetting(
    setting: Omit<ExpirationSetting, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ExpirationSetting>;
  getExpirationSettingById(id: number): Promise<ExpirationSetting | null>;
  updateExpirationSetting(
    id: number,
    setting: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null>;
  deleteExpirationSetting(id: number, context?: RequestContext): Promise<boolean>;
}
