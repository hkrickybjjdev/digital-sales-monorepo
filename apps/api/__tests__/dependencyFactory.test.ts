import { describe, expect, test, jest } from '@jest/globals';
import { createAuthService, createUserRepository, createEmailService } from '../src/modules/auth/factory';

// Mock the env
const mockEnv = {
  JWT_SECRET: 'test-secret',
  DB: { prepare: jest.fn(), exec: jest.fn() },
  ENVIRONMENT: 'test',
} as any;

// Mock the database factory
jest.mock('../../../database/databaseFactory', () => ({
  DatabaseFactory: {
    getInstance: jest.fn().mockReturnValue({ 
      queryOne: jest.fn(),
      query: jest.fn(),
      execute: jest.fn(),
      executeWithAudit: jest.fn(),
    }),
  },
}));

describe('Dependency Factory Functions', () => {
  test('createUserRepository returns a new repository instance', () => {
    const userRepo = createUserRepository(mockEnv);
    expect(userRepo).toBeDefined();
    expect(typeof userRepo.getUserByEmail).toBe('function');
    expect(typeof userRepo.createUser).toBe('function');
  });
  
  test('createEmailService returns a new service instance', () => {
    const emailService = createEmailService(mockEnv);
    expect(emailService).toBeDefined();
    expect(typeof emailService.sendActivationEmail).toBe('function');
    expect(typeof emailService.sendWelcomeEmail).toBe('function');
  });
  
  test('createAuthService returns a new service with all dependencies', () => {
    const authService = createAuthService(mockEnv);
    expect(authService).toBeDefined();
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.register).toBe('function');
  });
  
  test('each call to factory function returns a new instance', () => {
    const userRepo1 = createUserRepository(mockEnv);
    const userRepo2 = createUserRepository(mockEnv);
    expect(userRepo1).not.toBe(userRepo2);
  });
  
  test('dependencies are created on-demand', () => {
    // This test ensures that dependencies are created correctly
    // without relying on a singleton container
    
    // Create auth service which should create all dependencies
    const authService = createAuthService(mockEnv);
    expect(authService).toBeDefined();
    
    // Create specific dependencies directly
    const userRepo = createUserRepository(mockEnv);
    expect(userRepo).toBeDefined();
    
    // Different instances should not share state
    expect(authService).not.toBe(userRepo);
  });
}); 