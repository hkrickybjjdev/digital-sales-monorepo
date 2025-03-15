import { z } from 'zod';

/**
 * Auth module webhook event types
 */
export const AuthWebhookEventSchema = z.enum([
  'user.created',
  'user.updated', 
  'user.deleted'
]);

export type AuthWebhookEvent = z.infer<typeof AuthWebhookEventSchema>;

/**
 * User data in auth webhook payloads
 */
export const AuthWebhookUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().optional()
});

export type AuthWebhookUser = z.infer<typeof AuthWebhookUserSchema>;

/**
 * Previous user data for update events
 */
export const PreviousUserDataSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional()
});

export type PreviousUserData = z.infer<typeof PreviousUserDataSchema>;

/**
 * Base webhook payload schema
 */
export const BaseAuthWebhookSchema = z.object({
  event: AuthWebhookEventSchema,
  user: AuthWebhookUserSchema
});

/**
 * User created webhook schema
 */
export const UserCreatedWebhookSchema = BaseAuthWebhookSchema.extend({
  event: z.literal('user.created')
});

export type UserCreatedWebhook = z.infer<typeof UserCreatedWebhookSchema>;

/**
 * User updated webhook schema
 */
export const UserUpdatedWebhookSchema = BaseAuthWebhookSchema.extend({
  event: z.literal('user.updated'),
  previous: PreviousUserDataSchema
});

export type UserUpdatedWebhook = z.infer<typeof UserUpdatedWebhookSchema>;

/**
 * User deleted webhook schema
 */
export const UserDeletedWebhookSchema = BaseAuthWebhookSchema.extend({
  event: z.literal('user.deleted')
});

export type UserDeletedWebhook = z.infer<typeof UserDeletedWebhookSchema>;

/**
 * Combined auth webhook schema using discriminated union
 */
export const AuthWebhookSchema = z.discriminatedUnion('event', [
  UserCreatedWebhookSchema,
  UserUpdatedWebhookSchema,
  UserDeletedWebhookSchema
]);

export type AuthWebhook = z.infer<typeof AuthWebhookSchema>; 