import { 
  Page, 
  CreatePageRequest, 
  UpdatePageRequest, 
  PageType,
  PageContent,
  CreatePageContentRequest,
  Registration,
  CreateRegistrationRequest,
  PageStats
} from '../models/schemas';

/**
 * Interface for PageService
 */
export interface IPageService {
  createPage(userId: string, request: CreatePageRequest): Promise<Page>;
  getPageById(id: string): Promise<Page | null>;
  getPageByShortId(shortId: string): Promise<Page | null>;
  updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null>;
  deletePage(id: string, userId: string): Promise<boolean>;
  listUserPages(userId: string, limit?: number, offset?: number, type?: PageType): Promise<{
    pages: Page[];
    total: number;
    hasMore: boolean;
  }>;
}

/**
 * Interface for ContentService
 */
export interface IContentService {
  createPageContent(pageId: string, userId: string, request: CreatePageContentRequest): Promise<PageContent | null>;
  getPageContentById(id: string): Promise<PageContent | null>;
  getPageContents(pageId: string): Promise<PageContent[]>;
  updatePageContent(id: string, pageId: string, userId: string, updates: Partial<CreatePageContentRequest>): Promise<PageContent | null>;
  deletePageContent(id: string, pageId: string, userId: string): Promise<boolean>;
}

/**
 * Interface for RegistrationService
 */
export interface IRegistrationService {
  createRegistration(shortId: string, request: CreateRegistrationRequest): Promise<{ registration: Registration | null; error?: string }>;
  getRegistrations(pageId: string, userId: string, limit?: number, offset?: number): Promise<{
    registrations: Registration[];
    total: number;
    hasMore: boolean;
  }>;
  exportRegistrationsAsCsv(pageId: string, userId: string): Promise<string>;
}

/**
 * Interface for PageCacheService
 */
export interface IPageCacheService {
  cachePage(page: Page, expirationTtl?: number): Promise<void>;
  getPageFromCache(shortId: string): Promise<Page | null>;
  invalidatePageCache(shortId: string): Promise<void>;
  incrementPageViews(id: string, shortId: string): Promise<void>;
  incrementConversions(id: string, shortId: string): Promise<void>;
  getPageStats(id: string): Promise<PageStats | null>;
}

/**
 * Interface for PageRepository
 */
export interface IPageRepository {
  createPage(userId: string, request: CreatePageRequest): Promise<Page>;
  getPageById(id: string): Promise<Page | null>;
  getPageByShortId(shortId: string): Promise<Page | null>;
  updatePage(id: string, userId: string, request: UpdatePageRequest): Promise<Page | null>;
  deletePage(id: string, userId: string): Promise<boolean>;
  listUserPages(userId: string, limit?: number, offset?: number, type?: PageType): Promise<Page[]>;
  getUserPagesCount(userId: string, type?: PageType): Promise<number>;
}

/**
 * Interface for ContentRepository
 */
export interface IContentRepository {
  createPageContent(pageId: string, userId: string, request: CreatePageContentRequest): Promise<PageContent | null>;
  getPageContentById(id: string): Promise<PageContent | null>;
  getPageContents(pageId: string): Promise<PageContent[]>;
  updatePageContent(id: string, pageId: string, userId: string, updates: Partial<CreatePageContentRequest>): Promise<PageContent | null>;
  deletePageContent(id: string, pageId: string, userId: string): Promise<boolean>;
}

/**
 * Interface for RegistrationRepository
 */
export interface IRegistrationRepository {
  createRegistration(pageId: string, request: CreateRegistrationRequest): Promise<Registration>;
  getRegistrations(pageId: string, userId: string, limit?: number, offset?: number): Promise<Registration[]>;
  getRegistrationCount(pageId: string): Promise<number>;
}