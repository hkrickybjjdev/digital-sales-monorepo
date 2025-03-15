import { z } from 'zod';

// Plan schema
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isVisible: z.number().transform(Boolean),
  features: z.string().transform(str => JSON.parse(str))
});

export type Plan = z.infer<typeof planSchema>;

// Price schema
export const priceSchema = z.object({
  id: z.string(),
  planId: z.string().nullable(),
  productId: z.string().nullable(),
  currency: z.string(),
  interval: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  billingScheme: z.string(),
  type: z.string()
});

export type Price = z.infer<typeof priceSchema>;

// PlanWithPrices schema
export const planWithPricesSchema = planSchema.extend({
  prices: z.array(priceSchema).optional()
});

export type PlanWithPrices = z.infer<typeof planWithPricesSchema>;

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  planId: z.string(),
  startDate: z.number(),
  endDate: z.number().nullable(),
  status: z.string(),
  paymentGateway: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  cancelAt: z.number().nullable()
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// SubscriptionWithPlan schema
export const subscriptionWithPlanSchema = subscriptionSchema.extend({
  plan: planSchema.optional()
});

export type SubscriptionWithPlan = z.infer<typeof subscriptionWithPlanSchema>;

// Request schemas
export const createSubscriptionSchema = z.object({
  teamId: z.string(),
  planId: z.string(),
  interval: z.enum(['month', 'year']),
  paymentMethod: z.string().optional()
});

export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing']).optional()
});

export type UpdateSubscriptionRequest = z.infer<typeof updateSubscriptionSchema>;