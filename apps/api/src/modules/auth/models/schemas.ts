import { z } from 'zod';

// User schema for validation
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  lockedAt: z.number().nullable(),
  emailVerified: z.number().default(0),
  failedAttempts: z.number().default(0),
  activationToken: z.string().nullable(),
  activationTokenExpiresAt: z.number().nullable()
});

// Login request schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Registration request schema
export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

// Auth response schema
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
  token: z.string(),
  expiresAt: z.number(),
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Reset password request schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Password reset response schema
export const resetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Types derived from schemas
export type User = z.infer<typeof userSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ResetResponse = z.infer<typeof resetResponseSchema>;

// Session type
export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

// Activation response schema
export const activationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type ActivationResponse = z.infer<typeof activationResponseSchema>;

// Resend activation schema
export const resendActivationSchema = z.object({
  email: z.string().email()
});

export type ResendActivationRequest = z.infer<typeof resendActivationSchema>;

// Password reset database entity
export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  used: number;
  createdAt: number;
  updatedAt: number;
}