import { User, Session, AuthResponse, LoginRequest, RegisterRequest, ActivationResponse, ResendActivationRequest } from '../models/schemas';

/**
 * Interface for the AuthService
 * Defines the contract that any auth service implementation should follow
 */
export interface IAuthService {
  register(data: RegisterRequest): Promise<{ error?: string } & Partial<AuthResponse>>;
  login(data: LoginRequest): Promise<{ error?: string } & Partial<AuthResponse>>;
  getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null>;
  updateUser(userId: string, data: { name?: string; email?: string }): Promise<Omit<User, 'passwordHash'> | null>;
  deleteUser(userId: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<void>;
  activateUser(token: string): Promise<ActivationResponse>;
  resendActivationEmail(data: ResendActivationRequest): Promise<ActivationResponse>;
}

/**
 * Interface for the UserRepository
 * Defines the contract that any user repository implementation should follow
 */
export interface IUserRepository {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByActivationToken(token: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  lockAccount(userId: string): Promise<void>;
  unlockAccount(userId: string): Promise<void>;
  incrementFailedAttempts(userId: string): Promise<number>;
  resetFailedAttempts(userId: string): Promise<void>;
  updateUser(userId: string, data: { name?: string; email?: string }): Promise<User | null>;
  deleteUser(userId: string): Promise<boolean>;
  createSession(userId: string, expiresInSeconds?: number): Promise<Session>;
  getSessionById(id: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  activateUser(userId: string): Promise<void>;
  setActivationToken(userId: string, token: string, expiresAt: number): Promise<void>;
}

/**
 * Interface for the webhook service
 */
export interface IWebhookService {
  /**
   * Trigger a webhook event to the Teams module for user creation
   */
  triggerUserCreated(user: {
    id: string;
    email: string;
    name: string;
    createdAt: number;
  }): Promise<void>;
  
  /**
   * Trigger a webhook event to the Teams module for user updates
   */
  triggerUserUpdated(user: {
    id: string;
    email: string;
    name: string;
    updatedAt: number;
  }, previous: {
    email?: string;
    name?: string;
  }): Promise<void>;
  
  /**
   * Trigger a webhook event to the Teams module for user deletion
   */
  triggerUserDeleted(user: {
    id: string;
    deletedAt: number;
  }): Promise<void>;
  
  /**
   * Trigger a webhook event for user activation
   */
  triggerUserActivated(user: {
    id: string;
    email: string;
    name: string;
    activatedAt: number;
  }): Promise<void>;
}

/**
 * Interface for email service
 */
export interface IEmailService {
  /**
   * Send an activation email to the user
   */
  sendActivationEmail(to: string, name: string, activationLink: string): Promise<boolean>;
  
  /**
   * Send a welcome email to the user after successful activation
   */
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
}