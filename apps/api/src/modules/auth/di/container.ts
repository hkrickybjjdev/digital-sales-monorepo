import { UserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';
import { Env } from '../../../types';
import { IAuthService, IUserRepository } from '../services/interfaces';

// Interface for the auth module's DI container
export interface AuthContainer {
  userRepository: IUserRepository;
  authService: IAuthService;
}

// Singleton instances with their associated environment
let userRepositoryInstance: UserRepository | null = null;
let authServiceInstance: AuthService | null = null;
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
  
  return {
    userRepository: userRepositoryInstance,
    authService: authServiceInstance
  };
}

// For testing purposes - allows resetting the singletons
export function resetAuthContainer(): void {
  userRepositoryInstance = null;
  authServiceInstance = null;
  containerEnv = null;
}