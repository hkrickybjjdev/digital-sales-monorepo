import { z } from 'zod';

// Page Type Schema
export const PageTypeSchema = z.enum([
  'countdown',
  'flash-sale',
  'event-registration',
  'limited-offer',
]);

export type PageType = z.infer<typeof PageTypeSchema>;

// Page Customization Schema
export const PageCustomizationSchema = z
  .object({
    theme: z.string().optional(),
    colors: z
      .object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        background: z.string().optional(),
        text: z.string().optional(),
      })
      .optional(),
    logo: z.string().optional(),
    fontFamily: z.string().optional(),
    css: z.string().optional(),
  })
  .optional();

// Settings Schemas
export const CountdownSettingsSchema = z.object({
  countdownTarget: z.number(), // Unix timestamp
  postCountdownAction: z.enum(['redirect', 'show-message', 'show-form']),
  redirectUrl: z.string().url().optional(),
  messageTitle: z.string().optional(),
  messageContent: z.string().optional(),
});

export const FlashSaleSettingsSchema = z.object({
  saleEndTime: z.number(), // Unix timestamp
  discountPercentage: z.number().optional(),
  originalPriceDisplay: z.boolean().optional(),
  inventoryLimit: z.number().optional(),
  soldOutAction: z.enum(['redirect', 'show-message']).optional(),
  postSaleRedirectUrl: z.string().url().optional(),
});

export const EventRegistrationSettingsSchema = z.object({
  eventStartTime: z.number(), // Unix timestamp
  eventEndTime: z.number(), // Unix timestamp
  eventLocation: z.enum(['virtual', 'physical']),
  physicalAddress: z.string().optional(),
  virtualPlatform: z.enum(['zoom', 'meet', 'teams', 'custom']).optional(),
  platformLink: z.string().url().optional(),
  maxAttendees: z.number().optional(),
  waitlistEnabled: z.boolean().optional(),
});

export const LimitedOfferSettingsSchema = z.object({
  offerEndTime: z.number(), // Unix timestamp
  discountCode: z.string().optional(),
  bonusDescription: z.string().optional(),
  limitedQuantity: z.number().optional(),
  postOfferAction: z.enum(['redirect', 'show-alternate']).optional(),
});

// Combined Settings Schema
export const PageSettingsSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('countdown'), settings: CountdownSettingsSchema }),
  z.object({ type: z.literal('flash-sale'), settings: FlashSaleSettingsSchema }),
  z.object({ type: z.literal('event-registration'), settings: EventRegistrationSettingsSchema }),
  z.object({ type: z.literal('limited-offer'), settings: LimitedOfferSettingsSchema }),
]);

// Page Schema
export const PageSchema = z.object({
  id: z.string(),
  shortId: z.string(),
  userId: z.string(),
  type: PageTypeSchema,
  createdAt: z.number(),
  expiresAt: z.number().nullable(),
  launchAt: z.number().nullable(),
  isActive: z.boolean(),
  customization: PageCustomizationSchema,
  settings: z.union([
    CountdownSettingsSchema,
    FlashSaleSettingsSchema,
    EventRegistrationSettingsSchema,
    LimitedOfferSettingsSchema,
  ]),
});

export type Page = z.infer<typeof PageSchema>;

// Page Content Schema
export const PageContentSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  contentType: z.string(),
  productId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  priceInCents: z.number(),
  currency: z.string(),
  metadata: z.record(z.any()),
});

export type PageContent = z.infer<typeof PageContentSchema>;

// Registration Schema
export const RegistrationSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  registeredAt: z.number(),
  customFields: z.record(z.any()).optional(),
});

export type Registration = z.infer<typeof RegistrationSchema>;

// Request Schemas
export const CreatePageRequestSchema = z.object({
  type: PageTypeSchema,
  expiresAt: z.number().optional(),
  launchAt: z.number().optional(),
  isActive: z.boolean().optional(),
  customization: PageCustomizationSchema,
  settings: z.union([
    CountdownSettingsSchema,
    FlashSaleSettingsSchema,
    EventRegistrationSettingsSchema,
    LimitedOfferSettingsSchema,
  ]),
});

export type CreatePageRequest = z.infer<typeof CreatePageRequestSchema>;

export const UpdatePageRequestSchema = z.object({
  expiresAt: z.number().optional(),
  launchAt: z.number().optional(),
  isActive: z.boolean().optional(),
  customization: PageCustomizationSchema,
  settings: z
    .union([
      CountdownSettingsSchema,
      FlashSaleSettingsSchema,
      EventRegistrationSettingsSchema,
      LimitedOfferSettingsSchema,
    ])
    .optional(),
});

export type UpdatePageRequest = z.infer<typeof UpdatePageRequestSchema>;

export const CreatePageContentRequestSchema = z.object({
  contentType: z.string(),
  productId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  priceInCents: z.number(),
  currency: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type CreatePageContentRequest = z.infer<typeof CreatePageContentRequestSchema>;

export const CreateRegistrationRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

export type CreateRegistrationRequest = z.infer<typeof CreateRegistrationRequestSchema>;

export const PageStatsSchema = z.object({
  views: z.number(),
  conversions: z.number(),
  conversionRate: z.number(),
});

export type PageStats = z.infer<typeof PageStatsSchema>;
