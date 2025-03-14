import { z } from 'zod';

// Organization schema
export const organizationSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(2).max(100),
  isEnterprise: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Create organization request schema
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  ownerId: z.string().uuid(),
  isEnterprise: z.boolean().optional().default(false),
});

// Update organization request schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isEnterprise: z.boolean().optional(),
});

// Group schema
export const groupSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Create group request schema
export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  organizationId: z.string().uuid(),
});

// Update group request schema
export const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

// Role schema
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50),
});

// User role schema
export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

// Assign user role request schema
export const assignUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

// Remove user role request schema
export const removeUserRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

// Plan features schema
export const planFeaturesSchema = z.object({
  pageLimit: z.number().int().positive(),
  fileStorage: z.number().int().positive(),
  analytics: z.boolean(),
  customDomain: z.boolean().optional(),
  dedicatedSupport: z.boolean().optional(),
}).catchall(z.any());

// Plan schema
export const planSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  priceInCents: z.number().int().nonnegative(),
  currency: z.string().length(3), // e.g., "USD"
  interval: z.enum(["monthly", "yearly", "quarterly"]),
  isVisible: z.boolean().default(true),
  features: planFeaturesSchema,
});

// Subscription status schema
export const subscriptionStatusSchema = z.enum([
  'active',
  'canceled',
  'past_due',
  'free',
  'trial'
]);

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.number(),
  endDate: z.number().nullable(),
  status: subscriptionStatusSchema,
  stripeSubscriptionId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Create subscription request schema
export const createSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
  paymentMethodId: z.string().optional(),
});

// Update subscription request schema
export const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  status: subscriptionStatusSchema.optional(),
  endDate: z.number().optional()
});

// User with roles schema
export const userWithRolesSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  organizationId: z.string().uuid().nullable(),
  groupId: z.string().uuid().nullable(),
  roles: z.array(roleSchema),
});

// Organization with groups schema
export const organizationWithGroupsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  isEnterprise: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
  groups: z.array(groupSchema),
});

// User permissions schema
export const userPermissionsSchema = z.object({
  canManageOrganization: z.boolean(),
  canManageUsers: z.boolean(),
  canCreatePages: z.boolean(),
  canViewAnalytics: z.boolean(),
  canManageSubscriptions: z.boolean(),
  canManageProducts: z.boolean(),
  canInviteUsers: z.boolean(),
});

// Export types derived from the schemas
export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;

export type Group = z.infer<typeof groupSchema>;
export type CreateGroupRequest = z.infer<typeof createGroupSchema>;
export type UpdateGroupRequest = z.infer<typeof updateGroupSchema>;

export type Role = z.infer<typeof roleSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type AssignUserRoleRequest = z.infer<typeof assignUserRoleSchema>;
export type RemoveUserRoleRequest = z.infer<typeof removeUserRoleSchema>;

export type PlanFeatures = z.infer<typeof planFeaturesSchema>;
export type Plan = z.infer<typeof planSchema>;

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionSchema>;

export type UserWithRoles = z.infer<typeof userWithRolesSchema>;
export type OrganizationWithGroups = z.infer<typeof organizationWithGroupsSchema>;
export type UserPermissions = z.infer<typeof userPermissionsSchema>;