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

/**
 * Class-based dependency injection container for the auth module
 * Creates and manages singleton instances of services
 */
export class Container {
  private static instance: Container;
  private services: Partial<AuthContainer> = {};
  private env: Env | null = null;

  private constructor() {}

  /**
   * Gets the singleton container instance
   * @returns The container instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initializes the container with environment variables
   * @param env Cloudflare Workers environment
   */
  public initialize(env: Env): void {
    // If environment changes, reset the container
    if (this.env && this.env !== env) {
      this.clear();
    }

    // Store current environment
    this.env = env;

    // Only initialize services if they haven't been created yet
    if (Object.keys(this.services).length === 0) {
      // Create the repositories
      const userRepository = new UserRepository(env);
      const passwordResetRepository = new PasswordResetRepository(env);

      // Create the webhook service
      const webhookService = new WebhookService(env);

      // Create the email service
      const emailService = new EmailService(env);

      // Create the auth service with its dependencies
      const authService = new AuthService(
        env,
        userRepository,
        passwordResetRepository,
        webhookService,
        emailService
      );

      // Register all services
      this.services.userRepository = userRepository;
      this.services.passwordResetRepository = passwordResetRepository;
      this.services.authService = authService;
      this.services.webhookService = webhookService;
      this.services.emailService = emailService;
    }
  }

  /**
   * Gets a service instance by name
   * @param serviceName The name of the service to retrieve
   * @returns The service instance
   */
  public get<K extends keyof AuthContainer>(serviceName: K): AuthContainer[K] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found or not initialized`);
    }
    return service as AuthContainer[K];
  }

  /**
   * For testing: clear all services and reset the container
   */
  public clear(): void {
    this.services = {};
    this.env = null;
  }
}

/**
 * Factory function to get the auth container
 * @param env Cloudflare Workers environment
 * @returns The initialized auth container
 */
function getContainer(env: Env): Container {
  const container = Container.getInstance();
  container.initialize(env);
  return container;
}

/**
 * Helper function to get a service from the container
 * @param env Cloudflare Workers environment
 * @param serviceName The name of the service to retrieve
 * @returns The service instance
 */
export function getService<K extends keyof AuthContainer>(
  env: Env,
  serviceName: K
): AuthContainer[K] {
  return getContainer(env).get(serviceName);
}
