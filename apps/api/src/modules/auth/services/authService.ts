import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { UserRepository } from '../repositories/userRepository';
import { WebhookService } from './webhookService';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/schemas';
import { Env } from '../../../types';
import { IAuthService } from './interfaces';

export class AuthService implements IAuthService {
  private jwtSecret: string;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private webhookService: WebhookService;

  constructor(
    private readonly env: Env,
    private readonly userRepository: UserRepository
  ) {
    this.jwtSecret = env.JWT_SECRET;
    this.webhookService = new WebhookService(env);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<{ error?: string } & Partial<AuthResponse>> {

    // Check if user already exists
    const existingUser = await this.userRepository.getUserByEmail(data.email);
    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash: passwordHash,
      lockedAt: null,
      emailVerified: 0,
      failedAttempts: 0
    });

    // Trigger webhook for user creation
    try {
      await this.webhookService.triggerUserCreated({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to trigger user created webhook:', error);
      // Continue with registration even if webhook fails
    }

    // Create session and generate JWT
    const authResponse = await this.generateAuthResponse(user);
    return authResponse;
  }

  /**
   * Login an existing user
   */
  async login(data: LoginRequest): Promise<{ error?: string } & Partial<AuthResponse>> {

    // Find user by email
    const user = await this.userRepository.getUserByEmail(data.email);
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Check if account is locked
    if (user.lockedAt) {
      return { error: 'Account is locked. Please contact support.' };
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = await this.userRepository.incrementFailedAttempts(user.id);

      // Lock account if max attempts exceeded
      if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.userRepository.lockAccount(user.id);
        return { error: 'Account has been locked due to too many failed attempts. Please contact support.' };
      }

      return { error: 'Invalid email or password' };
    }

    // Reset failed attempts on successful login
    await this.userRepository.resetFailedAttempts(user.id);

    // Create session and generate JWT
    const authResponse = await this.generateAuthResponse(user);
    return authResponse;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {

    const user = await this.userRepository.getUserById(id);

    if (!user) {
      return null;
    }

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generate JWT token
   */
  private async generateToken(userId: string, sessionId: string): Promise<string> {
    const secret = new TextEncoder().encode(this.jwtSecret);
    const alg = 'HS256';

    return new jose.SignJWT({
      sub: userId,
      sid: sessionId
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days
      .sign(secret);
  }

  /**
   * Generate auth response with user info and token
   */
  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    // Create session
    const session = await this.userRepository.createSession(user.id);

    // Generate JWT token
    const token = await this.generateToken(user.id, session.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.userRepository.deleteExpiredSessions();
  }

  /**
   * Update a user's profile
   */
  async updateUser(userId: string, data: { name?: string; email?: string }): Promise<Omit<User, 'passwordHash'> | null> {
    // Get the current user data for comparison
    const currentUser = await this.userRepository.getUserById(userId);
    if (!currentUser) {
      return null;
    }

    // Store previous values for webhook
    const previous = {
      name: currentUser.name,
      email: currentUser.email
    };

    // Update the user
    const updatedUser = await this.userRepository.updateUser(userId, data);
    if (!updatedUser) {
      return null;
    }

    // Trigger webhook for user update
    try {
      await this.webhookService.triggerUserUpdated({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        updatedAt: Date.now()
      }, previous);
    } catch (error) {
      console.error('Failed to trigger user updated webhook:', error);
      // Continue with update even if webhook fails
    }

    // Return the updated user without the password hash
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete a user account
   */
  async deleteUser(userId: string): Promise<boolean> {
    // Get the user to ensure they exist
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      return false;
    }

    // Delete the user
    const success = await this.userRepository.deleteUser(userId);
    if (!success) {
      return false;
    }

    // Trigger webhook for user deletion
    try {
      await this.webhookService.triggerUserDeleted({
        id: userId,
        deletedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to trigger user deleted webhook:', error);
      // Continue with deletion even if webhook fails
    }

    return true;
  }
}