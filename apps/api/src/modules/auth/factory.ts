import { createDatabase } from '../../database/databaseFactory';
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

// Interface for the auth module's services
export interface AuthServices {
  userRepository: IUserRepository;
  passwordResetRepository: PasswordResetRepository;
  authService: IAuthService;
  webhookService: IWebhookService;
  emailService: IEmailService;
}

/**
 * Factory functions to create service instances directly
 * This approach is more stateless and better for Cloudflare Workers
 */

/**
 * Create a user repository instance
 */
export function createUserRepository(env: Env): UserRepository {
  const dbService = createDatabase(env);
  return new UserRepository(dbService);
}

/**
 * Create a password reset repository instance
 */
export function createPasswordResetRepository(env: Env): PasswordResetRepository {
  const dbService = createDatabase(env);
  return new PasswordResetRepository(dbService);
}

/**
 * Create a webhook service instance
 */
export function createWebhookService(env: Env): WebhookService {
  return new WebhookService(env);
}

/**
 * Create an email service instance
 */
export function createEmailService(env: Env): EmailService {
  return new EmailService(env);
}

/**
 * Create an auth service instance with all dependencies
 */
export function createAuthService(env: Env): AuthService {
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

/**
 * Helper function to create an individual service
 * This maintains backward compatibility with existing code
 */
export function getService<K extends keyof AuthServices>(
  env: Env,
  serviceName: K
): AuthServices[K] {
  switch (serviceName) {
    case 'userRepository':
      return createUserRepository(env) as unknown as AuthServices[K];
    case 'passwordResetRepository':
      return createPasswordResetRepository(env) as unknown as AuthServices[K];
    case 'webhookService':
      return createWebhookService(env) as unknown as AuthServices[K];
    case 'emailService':
      return createEmailService(env) as unknown as AuthServices[K];
    case 'authService':
      return createAuthService(env) as unknown as AuthServices[K];
    default:
      throw new Error(`Service ${String(serviceName)} not found`);
  }
}
