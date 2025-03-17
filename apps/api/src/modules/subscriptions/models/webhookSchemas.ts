import { z } from 'zod';

/**
 * Team module webhook event types
 */
export const TeamWebhookEventSchema = z.enum(['team.created', 'team.deleted']);

export type TeamWebhookEvent = z.infer<typeof TeamWebhookEventSchema>;

/**
 * Team data in team webhook payloads
 */
export const TeamWebhookDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(), // Owner ID
  createdAt: z.number(),
});

export type TeamWebhookData = z.infer<typeof TeamWebhookDataSchema>;

/**
 * Base webhook payload schema
 */
export const BaseTeamWebhookSchema = z.object({
  event: TeamWebhookEventSchema,
  team: TeamWebhookDataSchema,
});

/**
 * Team created webhook schema
 */
export const TeamCreatedWebhookSchema = BaseTeamWebhookSchema.extend({
  event: z.literal('team.created'),
});

export type TeamCreatedWebhook = z.infer<typeof TeamCreatedWebhookSchema>;

/**
 * Team deleted webhook schema
 */
export const TeamDeletedWebhookSchema = BaseTeamWebhookSchema.extend({
  event: z.literal('team.deleted'),
});

export type TeamDeletedWebhook = z.infer<typeof TeamDeletedWebhookSchema>;

/**
 * Combined team webhook schema using discriminated union
 */
export const TeamWebhookSchema = z.discriminatedUnion('event', [
  TeamCreatedWebhookSchema,
  TeamDeletedWebhookSchema,
]);

export type TeamWebhook = z.infer<typeof TeamWebhookSchema>;
