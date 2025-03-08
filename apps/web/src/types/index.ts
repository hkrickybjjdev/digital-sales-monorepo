import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().positive("Price must be positive"),
  imageUrl: z.string().url().optional(),
  createdAt: z.date(),
  launchTime: z.date(),
  expiresAt: z.date(),
  isAvailable: z.boolean(),
  downloadUrl: z.string().url().optional(),
  sellerId: z.string().uuid(),
});

export type Product = z.infer<typeof productSchema>;

// Sales Page schema
export const salesPageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Page title is required"),
  description: z.string().optional(),
  sellerId: z.string().uuid(),
  products: z.array(productSchema),
  createdAt: z.date(),
  launchTime: z.date(),
  expiresAt: z.date(),
  isActive: z.boolean(),
});

export type SalesPage = z.infer<typeof salesPageSchema>;

// Cart Item schema
export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  name: z.string(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Cart schema
export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  total: z.number().nonnegative(),
});

export type Cart = z.infer<typeof cartSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(cartItemSchema),
  total: z.number().positive(),
  status: z.enum(["pending", "paid", "failed"]),
  createdAt: z.date(),
  buyerEmail: z.string().email(),
  downloadLinks: z.array(z.string().url()).optional(),
});

export type Order = z.infer<typeof orderSchema>; 