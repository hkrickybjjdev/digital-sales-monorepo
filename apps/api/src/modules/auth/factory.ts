import { Env } from '../../types';
import { PasswordResetRepository } from './repositories/passwordResetRepository';
import { UserRepository } from './repositories/userRepository';
import { AuthService } from './services/authService';
import { EmailService } from './services/emailService';
import {
  IAuthService,
  IUserRepository,
  IWebhookService,
  IEmailService,
} from './services/interfaces';
import { WebhookService } from './services/webhookService';

/**
 * Factory functions to create service instances directly
 * This approach is more stateless and better for Cloudflare Workers
 */

/**
 * Create a user repository instance
 */
export function createUserRepository(env: Env): IUserRepository {
  return new UserRepository(env);
}

/**
 * Create a password reset repository instance
 */
export function createPasswordResetRepository(env: Env): PasswordResetRepository {
  return new PasswordResetRepository(env);
}

/**
 * Create a webhook service instance
 */
export function createWebhookService(env: Env): IWebhookService {
  return new WebhookService(env);
}

/**
 * Create an email service instance
 */
export function createEmailService(env: Env): IEmailService {
  return new EmailService(env);
}

/**
 * Create an auth service instance with all dependencies
 */
export function createAuthService(env: Env): IAuthService {
  const userRepository = createUserRepository(env);
  const passwordResetRepository = createPasswordResetRepository(env);
  const webhookService = createWebhookService(env);
  const emailService = createEmailService(env);
  
  return new AuthService(
    env,
    userRepository,
    passwordResetRepository,
    webhookService,
    emailService
  );
}