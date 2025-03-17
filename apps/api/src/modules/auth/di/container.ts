import { Env } from '../../../types';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';
import { EmailService } from '../services/emailService';
import {
  IAuthService,
  IUserRepository,
  IWebhookService,
  IEmailService,
} from '../services/interfaces';
import { WebhookService } from '../services/webhookService';

// Interface for the auth module's DI container
export interface AuthContainer {
  userRepository: IUserRepository;
  passwordResetRepository: PasswordResetRepository;
  authService: IAuthService;
  webhookService: IWebhookService;
  emailService: IEmailService;
}

// Singleton instances with their associated environment
let userRepositoryInstance: UserRepository | null = null;
let passwordResetRepositoryInstance: PasswordResetRepository | null = null;
let authServiceInstance: AuthService | null = null;
let webhookServiceInstance: WebhookService | null = null;
let emailServiceInstance: EmailService | null = null;
let containerEnv: Env | null = null;

// Factory function to create the auth container
export function getAuthContainer(env: Env): AuthContainer {
  // If environment changes, recreate the instances to ensure consistency
  if (containerEnv && env !== containerEnv) {
    resetAuthContainer();
  }

  // Store the current environment
  containerEnv = env;

  // Create the repositories as singletons
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository(env);
  }

  if (!passwordResetRepositoryInstance) {
    passwordResetRepositoryInstance = new PasswordResetRepository(env.DB);
  }

  // Create the webhook service as a singleton
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService(env);
  }

  // Create the email service as a singleton
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService(env);
  }

  // Create the services with their dependencies as singletons
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(
      env,
      userRepositoryInstance,
      passwordResetRepositoryInstance,
      webhookServiceInstance,
      emailServiceInstance
    );
  }

  return {
    userRepository: userRepositoryInstance,
    passwordResetRepository: passwordResetRepositoryInstance,
    authService: authServiceInstance,
    webhookService: webhookServiceInstance,
    emailService: emailServiceInstance,
  };
}

// For testing purposes - allows resetting the singletons
export function resetAuthContainer(): void {
  userRepositoryInstance = null;
  passwordResetRepositoryInstance = null;
  authServiceInstance = null;
  webhookServiceInstance = null;
  emailServiceInstance = null;
  containerEnv = null;
}
