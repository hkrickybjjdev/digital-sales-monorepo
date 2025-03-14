import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/schemas';

/**
 * Interface for the AuthService
 * Defines the contract that any auth service implementation should follow
 */
export interface IAuthService {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null>;
  cleanupExpiredSessions(): Promise<void>;
}

/**
 * Interface for the UserRepository
 * Defines the contract that any user repository implementation should follow
 */
export interface IUserRepository {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  createSession(userId: string, expiresInSeconds?: number): Promise<{ id: string; userId: string; expiresAt: number; createdAt: number }>;
  getSessionById(id: string): Promise<{ id: string; userId: string; expiresAt: number; createdAt: number } | null>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}