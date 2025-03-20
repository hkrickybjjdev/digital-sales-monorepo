import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ActivationResponse,
  ResendActivationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetResponse,
} from '../models/schemas';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';

import { IAuthService, IWebhookService, IEmailService, IUserRepository } from './interfaces';

export class AuthService implements IAuthService {
  private jwtSecret: string;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private baseUrl: string;

  constructor(
    private readonly env: Env,
    private readonly userRepository: IUserRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly webhookService: IWebhookService,
    private readonly emailService: IEmailService
  ) {
    this.jwtSecret = env.JWT_SECRET;
    this.baseUrl =
      env.ENVIRONMENT === 'production' ? 'https://app.tempages.app' : 'http://localhost:8787';
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
    const activationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Create user with activation token
    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash: passwordHash,
      lockedAt: null,
      emailVerified: 0, // Set to 0 (not verified) by default
      failedAttempts: 0,
      activationToken,
      activationTokenExpiresAt,
      timezone: null, // Add timezone property
    });

    // Generate activation link
    const activationLink = `${this.baseUrl}/api/v1/auth/activate/${activationToken}`;

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
        createdAt: Date.now(),
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
        name: user.name,
      },
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
      if (
        !user.activationToken ||
        !user.activationTokenExpiresAt ||
        user.activationTokenExpiresAt < Date.now()
      ) {
        const activationToken = generateUUID();
        const activationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

        await this.userRepository.setActivationToken(
          user.id,
          activationToken,
          activationTokenExpiresAt
        );

        const activationLink = `${this.baseUrl}/api/v1/auth/activate/${activationToken}`;
        await this.emailService.sendActivationEmail(user.email, user.name, activationLink);
      }

      return {
        error:
          'Account not activated. Please check your email for the activation link or request a new one.',
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
        return {
          error: 'Account has been locked due to too many failed attempts. Please contact support.',
        };
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
        message: 'Invalid or expired activation token. Please request a new activation link.',
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

    // Check if the user has a team and subscription
    // To do this, we need to verify if the initial onboarding flow was successful
    // This is a defensive measure to ensure users have a team even if the webhook failed
    try {
      // We need to check the teams DB first to see if the user has a team
      const userHasTeam = await this.verifyUserHasTeam(user.id);

      if (!userHasTeam) {
        console.log(`User ${user.id} has no team. Re-triggering user creation webhook...`);
        // If no team exists for this user, re-trigger the user.created webhook
        // This will recreate the team and provisioning flow as if the user just registered
        await this.webhookService.triggerUserCreated({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: Date.now(),
        });
      } else {
        // If they have a team, check if they have a subscription
        const teamHasSubscription = await this.verifyTeamHasSubscription(user.id);
        if (!teamHasSubscription) {
          console.log(
            `User ${user.id} has a team but no subscription. Re-triggering team events...`
          );
          // Re-trigger the team.created event to ensure subscription is set up
          const teams = await this.getUserTeams(user.id);
          if (teams.length > 0) {
            await this.retriggerTeamCreatedEvent(teams[0].id, user.id, teams[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Error verifying team and subscription setup:', error);
      // Continue with activation even if verification fails - it's a supplementary check
    }

    // Trigger webhook for user activation
    /*
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
    }*/

    return {
      success: true,
      message: 'Account activated successfully. You can now log in.',
    };
  }

  /**
   * Check if the user has any teams
   */
  private async verifyUserHasTeam(userId: string): Promise<boolean> {
    const teams = await this.getUserTeams(userId);
    return teams.length > 0;
  }

  /**
   * Get user teams by querying the Team module's database
   */
  private async getUserTeams(userId: string): Promise<{ id: string; name: string }[]> {
    try {
      const result = await this.env.DB.prepare(
        `
        SELECT t.id, t.name
        FROM "Team" t
        JOIN "TeamMember" tm ON t.id = tm.teamId
        WHERE tm.userId = ?
      `
      )
        .bind(userId)
        .all();

      if (!result.results || result.results.length === 0) {
        return [];
      }

      return result.results.map(team => ({
        id: team.id as string,
        name: team.name as string,
      }));
    } catch (error) {
      console.error(`Error getting teams for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user's teams have a subscription
   */
  private async verifyTeamHasSubscription(userId: string): Promise<boolean> {
    try {
      // Get user teams
      const teams = await this.getUserTeams(userId);
      if (teams.length === 0) {
        return false;
      }

      // Check for subscriptions for the first team
      const teamId = teams[0].id;

      const result = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as count
        FROM "Subscription"
        WHERE teamId = ? AND (status = 'active' OR status = 'trialing')
      `
      )
        .bind(teamId)
        .first<{ count: number }>();

      return result !== null && result.count > 0;
    } catch (error) {
      console.error(`Error verifying subscription for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Retrigger team creation event to set up subscription
   */
  private async retriggerTeamCreatedEvent(
    teamId: string,
    userId: string,
    teamName: string
  ): Promise<void> {
    // Call the team webhook service to trigger a team.created event
    // This will cause the subscription service to provision a free plan
    try {
      const baseUrl = this.env.API_URL || 'http://localhost:8787';
      const secret = this.env.WEBHOOK_SECRET || 'dev-webhook-secret';

      const payload = {
        event: 'team.created',
        team: {
          id: teamId,
          name: teamName,
          userId: userId, // Owner ID
          createdAt: Date.now(),
        },
      };

      const signature = `sha256=${secret}-${JSON.stringify(payload).slice(0, 10)}`;

      // Send directly to the subscriptions webhook handler
      const response = await fetch(`${baseUrl}/api/v1/subscriptions/webhooks/teams/team-created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error re-triggering team created webhook: ${response.status} ${response.statusText}`,
          errorText
        );
      }
    } catch (error) {
      console.error('Failed to re-trigger team created webhook:', error);
    }
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
        message: 'If the email address exists in our system, an activation link has been sent.',
      };
    }

    // Check if user is already activated
    if (user.emailVerified) {
      return {
        success: false,
        message: 'This account is already activated. Please login.',
      };
    }

    // Generate new activation token
    const activationToken = generateUUID();
    const activationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Update user with new activation token
    await this.userRepository.setActivationToken(
      user.id,
      activationToken,
      activationTokenExpiresAt
    );

    // Generate activation link
    const activationLink = `${this.baseUrl}/api/v1/auth/activate/${activationToken}`;

    // Send activation email
    try {
      await this.emailService.sendActivationEmail(user.email, user.name, activationLink);
    } catch (error) {
      console.error('Failed to send activation email:', error);
      return {
        success: false,
        message: 'Failed to send activation email. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Activation link has been sent to your email address.',
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
    const { passwordHash: _, ...userWithoutPassword } = user;
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
      sid: sessionId,
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
        name: user.name,
      },
      token,
      expiresAt: session.expiresAt,
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
  async updateUser(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<Omit<User, 'passwordHash'> | null> {
    // Get the current user data for comparison
    const currentUser = await this.userRepository.getUserById(userId);
    if (!currentUser) {
      return null;
    }

    // Store previous values for webhook
    const previous = {
      name: currentUser.name,
      email: currentUser.email,
    };

    // Update the user
    const updatedUser = await this.userRepository.updateUser(userId, data);
    if (!updatedUser) {
      return null;
    }

    // Trigger webhook for user update
    try {
      await this.webhookService.triggerUserUpdated(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          updatedAt: Date.now(),
        },
        previous
      );
    } catch (error) {
      console.error('Failed to trigger user updated webhook:', error);
      // Continue with update even if webhook fails
    }

    // Return the updated user without the password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
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
        deletedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to trigger user deleted webhook:', error);
      // Continue with deletion even if webhook fails
    }

    return true;
  }

  /**
   * Forgot password
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ResetResponse> {
    try {
      const { email } = request;

      // Check if user exists
      const user = await this.userRepository.getUserByEmail(email);

      // For security, don't reveal if the email exists or not
      if (!user) {
        return {
          success: true,
          message:
            'If your email address exists in our database, you will receive a password recovery link at your email address shortly.',
        };
      }

      // Generate a secure random token
      const token = generateUUID();

      // Invalidate any existing tokens for this user
      await this.passwordResetRepository.invalidateUserTokens(user.id);

      // Store the new token
      await this.passwordResetRepository.createPasswordReset(user.id, token, 30); // 30 minutes expiry

      // Generate reset URL
      const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;

      // Send the password reset email
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

      return {
        success: true,
        message:
          'If your email address exists in our database, you will receive a password recovery link at your email address shortly.',
      };
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again later.',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetResponse> {
    try {
      const { token, password } = request;

      // Check if the token exists and is valid
      const passwordReset = await this.passwordResetRepository.getPasswordResetByToken(token);

      // Token doesn't exist or is already used
      if (!passwordReset) {
        return {
          success: false,
          message: 'Invalid or expired password reset token.',
        };
      }

      // Token is expired
      const now = Math.floor(Date.now() / 1000);
      if (passwordReset.expiresAt < now || passwordReset.used === 1) {
        return {
          success: false,
          message: 'Your password reset link has expired. Please request a new one.',
        };
      }

      // Get user
      const user = await this.userRepository.getUserById(passwordReset.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user password
      const updated = await this.userRepository.updateUserPassword(user.id, passwordHash);
      if (!updated) {
        return {
          success: false,
          message: 'Failed to update password. Please try again.',
        };
      }

      // Mark token as used
      await this.passwordResetRepository.markTokenAsUsed(token);

      // Notify via webhook if needed
      await this.webhookService.notifyPasswordReset({
        id: user.id,
        resetAt: Date.now(),
      });

      return {
        success: true,
        message:
          'Your password has been successfully reset. You can now login with your new password.',
      };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again later.',
      };
    }
  }
}
