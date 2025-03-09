import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { UserRepository } from '../models/userRepository';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/types';
import { Env } from '../../../types';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor(env: Env) {
    this.userRepository = new UserRepository(env);
    this.jwtSecret = env.JWT_SECRET;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      password_hash: passwordHash
    });

    // Create session and generate JWT
    return this.generateAuthResponse(user);
  }

  /**
   * Login an existing user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Create session and generate JWT
    return this.generateAuthResponse(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.userRepository.getUserById(id);
    
    if (!user) {
      return null;
    }

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Generate JWT token
   */
  private async generateToken(userId: string, sessionId: string): Promise<string> {
    const secret = new TextEncoder().encode(this.jwtSecret);
    const alg = 'HS256';

    // Create session
    const session = await this.userRepository.createSession(userId);

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
      expires_at: session.expires_at
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
}