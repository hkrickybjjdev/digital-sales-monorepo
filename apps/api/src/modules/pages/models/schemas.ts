import { z } from 'zod';

// Page schema for validation
export const pageSchema = z.object({
  id: z.number(),
  userId: z.number(),
  slug: z.string().nullable(),
  status: z.enum(['draft', 'published', 'expired', 'archived']).default('draft'),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Page Version schema for validation
export const pageVersionSchema = z.object({
  id: z.number(),
  pageId: z.number(),
  versionNumber: z.number(),
  isPublished: z.boolean().default(false),
  createdAt: z.number(),
  publishedAt: z.number().nullable(),
  publishFrom: z.number().nullable(),
  expirationId: z.number().nullable(),
});

// Page Version Translation schema for validation
export const pageVersionTranslationSchema = z.object({
  id: z.number(),
  versionId: z.number(),
  languageCode: z.string().min(2).max(10),
  socialShareTitle: z.string().nullable(),
  socialShareDescription: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaKeywords: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Content Block schema for validation
export const contentBlockSchema = z.object({
  id: z.number(),
  versionId: z.number(),
  blockType: z.string(),
  order: z.number(),
  content: z.string().nullable(),
  settings: z.string().nullable(), // JSON stored as string
  createdAt: z.number(),
  updatedAt: z.number(),
  displayState: z.enum(['live', 'expired']).default('live'),
});

// Content Block Translation schema for validation
export const contentBlockTranslationSchema = z.object({
  id: z.number(),
  contentBlockId: z.number(),
  languageCode: z.string().min(2).max(10),
  content: z.string().nullable(),
  settings: z.string().nullable(), // JSON stored as string
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Expiration Setting schema for validation
export const expirationSettingSchema = z.object({
  id: z.number(),
  expirationType: z.enum(['datetime', 'duration']),
  expiresAtDatetime: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  expirationAction: z.enum(['unpublish', 'redirect']),
  redirectUrl: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Create page request schema
export const createPageSchema = z.object({
  userId: z.number(),
  slug: z.string().optional(),
  expirationId: z.number().optional(),
  publishFrom: z.number().optional(),
  initialContentStructure: z.array(
    z.object({
      blockType: z.string(),
      order: z.number(),
      content: z.string().optional(),
      settings: z.string().optional(), // JSON stored as string
      translations: z
        .record(
          z.string(),
          z.object({
            content: z.string().optional(),
            settings: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  initialSettings: z.string().optional(), // JSON stored as string
  initialMetaDescriptionTranslations: z.record(z.string(), z.string()).optional(),
  initialMetaKeywordsTranslations: z.record(z.string(), z.string()).optional(),
  initialTitleTranslations: z.record(z.string(), z.string()).optional(),
  initialSocialShareTitleTranslations: z.record(z.string(), z.string()).optional(),
  initialSocialShareDescriptionTranslations: z.record(z.string(), z.string()).optional(),
});

// Update page draft request schema
export const savePageDraftSchema = z.object({
  pageId: z.number(),
  versionId: z.number().optional(),
  titleTranslations: z.record(z.string(), z.string()).optional(),
  settings: z.string().optional(), // JSON stored as string
  metaDescriptionTranslations: z.record(z.string(), z.string()).optional(),
  metaKeywordsTranslations: z.record(z.string(), z.string()).optional(),
  socialShareTitleTranslations: z.record(z.string(), z.string()).optional(),
  socialShareDescriptionTranslations: z.record(z.string(), z.string()).optional(),
  expirationId: z.number().optional(),
  publishFrom: z.number().optional(),
  contentBlocksData: z.array(
    z.object({
      id: z.number().optional(), // Will be undefined for new blocks
      blockType: z.string(),
      order: z.number(),
      content: z.string().optional(),
      settings: z.string().optional(), // JSON stored as string
      displayState: z.enum(['live', 'expired']).default('live'),
      translations: z
        .record(
          z.string(),
          z.object({
            id: z.number().optional(), // Will be undefined for new translations
            content: z.string().optional(),
            settings: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
});

// Publish page request schema
export const publishPageSchema = z.object({
  pageId: z.number(),
  versionId: z.number(),
});

// Types derived from schemas
export type Page = z.infer<typeof pageSchema>;
export type PageVersion = z.infer<typeof pageVersionSchema>;
export type PageVersionTranslation = z.infer<typeof pageVersionTranslationSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type ContentBlockTranslation = z.infer<typeof contentBlockTranslationSchema>;
export type ExpirationSetting = z.infer<typeof expirationSettingSchema>;
export type CreatePageRequest = z.infer<typeof createPageSchema>;
export type SavePageDraftRequest = z.infer<typeof savePageDraftSchema>;
export type PublishPageRequest = z.infer<typeof publishPageSchema>;

// Response types with additional information
export interface PageWithVersion extends Page {
  currentVersion: PageVersion;
  translations: Record<string, PageVersionTranslation>;
  contentBlocks: ContentBlock[];
  contentBlockTranslations: Record<string, Record<string, ContentBlockTranslation>>;
  expiration?: ExpirationSetting;
}
