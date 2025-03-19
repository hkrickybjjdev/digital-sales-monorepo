import { z } from 'zod';

// Common schema for localized text fields
const localizedTextSchema = z.object({
  en: z.string(),
  'zh-TW': z.string(),
});

/**
 * Schema for PredefinedContentBlock
 * Defines the structure and validation rules for content blocks
 */
export const predefinedContentBlockSchema = z.object({
  type: z.string(),
  displayName: localizedTextSchema,
  name: z.string(),
  category: z.string(),
  content_structure: z.record(z.any()).optional(),
  preview_image_url: z.string().optional(),
  isPublic: z.boolean().default(false),
  version: z.number().default(1),
  description: localizedTextSchema,
});

/**
 * Schema for PageSettingsDefinition
 * Defines the structure and validation rules for page settings
 */
export const pageSettingsDefinitionSchema = z.object({
  settingName: z.string(),
  displayName: localizedTextSchema,
  fieldType: z.string(),
  defaultValue: z.string().optional(),
  category: z.string(),
  order: z.number().default(0),
  options: z.string().optional(),
  group: z.string().optional(),
  description: localizedTextSchema,
  validationRules: z.record(z.any()).optional(),
  conditionalVisibility: z.record(z.any()).optional(),
  unit: z.string().optional(),
});

// Derive TypeScript types from the Zod schemas
export type PredefinedContentBlock = z.infer<typeof predefinedContentBlockSchema>;
export type PageSettingsDefinition = z.infer<typeof pageSettingsDefinitionSchema>;
