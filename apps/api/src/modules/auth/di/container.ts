import { UserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';
import { WebhookService } from '../services/webhookService';
import { Env } from '../../../types';
import { IAuthService, IUserRepository, IWebhookService } from '../services/interfaces';

// Interface for the auth module's DI container
export interface AuthContainer {
  userRepository: IUserRepository;
  authService: IAuthService;
  webhookService: IWebhookService;
}

// Singleton instances with their associated environment
let userRepositoryInstance: UserRepository | null = null;
let authServiceInstance: AuthService | null = null;
let webhookServiceInstance: WebhookService | null = null;
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
  
  // Create the services with their dependencies as singletons
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(env, userRepositoryInstance);
  }
  
  // Create the webhook service as a singleton
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService(env);
  }
  
  return {
    userRepository: userRepositoryInstance,
    authService: authServiceInstance,
    webhookService: webhookServiceInstance
  };
}

// For testing purposes - allows resetting the singletons
export function resetAuthContainer(): void {
  userRepositoryInstance = null;
  authServiceInstance = null;
  webhookServiceInstance = null;
  containerEnv = null;
}