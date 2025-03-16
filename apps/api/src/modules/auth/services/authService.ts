import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { UserRepository } from '../repositories/userRepository';
import { WebhookService } from './webhookService';
import { EmailService } from './emailService';
import { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ActivationResponse,
  ResendActivationRequest 
} from '../models/schemas';
import { Env } from '../../../types';
import { IAuthService, IWebhookService, IEmailService } from './interfaces';
import { generateUUID } from '../../../utils/utils';

export class AuthService implements IAuthService {
  private jwtSecret: string;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private baseUrl: string;

  constructor(
    private readonly env: Env,
    private readonly userRepository: UserRepository,
    private readonly webhookService: IWebhookService,
    private readonly emailService: IEmailService
  ) {
    this.jwtSecret = env.JWT_SECRET;
    this.baseUrl = env.ENVIRONMENT === 'production' 
      ? 'https://app.tempages.app' 
      : 'http://localhost:3000';
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

    // Generate activation token and set expiration (24 hours from now)
    const activationToken = generateUUID();
    const activationTokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);

    // Create user with activation token
    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash: passwordHash,
      lockedAt: null,
      emailVerified: 0, // Set to 0 (not verified) by default
      failedAttempts: 0,
      activationToken,
      activationTokenExpiresAt
    });

    // Generate activation link
    const activationLink = `${this.baseUrl}/activate?token=${activationToken}`;

    // Send activation email
    try {
      await this.emailService.sendActivationEmail(user.email, user.name, activationLink);
    } catch (error) {
      console.error('Failed to send activation email:', error);
      // Continue with registration even if email fails
    }

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

    // Return user info without generating a JWT (since the account is not activated yet)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
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

    // Check if account is activated/verified
    if (!user.emailVerified) {
      // Generate a new activation token if the current one is expired
      if (!user.activationToken || !user.activationTokenExpiresAt || user.activationTokenExpiresAt < Date.now()) {
        const activationToken = generateUUID();
        const activationTokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);
        
        await this.userRepository.setActivationToken(user.id, activationToken, activationTokenExpiresAt);
        
        const activationLink = `${this.baseUrl}/activate?token=${activationToken}`;
        await this.emailService.sendActivationEmail(user.email, user.name, activationLink);
      }
      
      return { 
        error: 'Account not activated. Please check your email for the activation link or request a new one.'
      };
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
   * Activate a user account
   */
  async activateUser(token: string): Promise<ActivationResponse> {
    // Find user by activation token
    const user = await this.userRepository.getUserByActivationToken(token);
    
    if (!user) {
      return { 
        success: false, 
        message: 'Invalid or expired activation token. Please request a new activation link.' 
      };
    }

    // Activate the user
    await this.userRepository.activateUser(user.id);

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Continue with activation even if email fails
    }

    // Trigger webhook for user activation
    try {
      await this.webhookService.triggerUserActivated({
        id: user.id,
        email: user.email,
        name: user.name,
        activatedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to trigger user activated webhook:', error);
      // Continue with activation even if webhook fails
    }

    return { 
      success: true, 
      message: 'Account activated successfully. You can now log in.' 
    };
  }

  /**
   * Resend activation email
   */
  async resendActivationEmail(data: ResendActivationRequest): Promise<ActivationResponse> {
    // Find user by email
    const user = await this.userRepository.getUserByEmail(data.email);
    
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { 
        success: true, 
        message: 'If the email address exists in our system, an activation link has been sent.' 
      };
    }

    // Check if user is already activated
    if (user.emailVerified) {
      return { 
        success: false, 
        message: 'This account is already activated. Please login.' 
      };
    }

    // Generate new activation token
    const activationToken = generateUUID();
    const activationTokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    // Update user with new activation token
    await this.userRepository.setActivationToken(user.id, activationToken, activationTokenExpiresAt);
    
    // Generate activation link
    const activationLink = `${this.baseUrl}/activate?token=${activationToken}`;

    // Send activation email
    try {
      await this.emailService.sendActivationEmail(user.email, user.name, activationLink);
    } catch (error) {
      console.error('Failed to send activation email:', error);
      return { 
        success: false, 
        message: 'Failed to send activation email. Please try again later.' 
      };
    }

    return { 
      success: true, 
      message: 'Activation link has been sent to your email address.' 
    };
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