# Dependency Management

## Overview

This document provides detailed information about the dependency management approach used in our Cloudflare Workers API. The approach is designed to optimize for the serverless, stateless nature of Cloudflare Workers while ensuring code remains maintainable and testable.

## The Factory Pattern

We use a factory pattern for creating service and repository instances directly where they're needed. This approach:

1. Creates dependencies on-demand within handler functions
2. Eliminates shared state between requests
3. Improves cold start performance by only initializing what's needed
4. Simplifies testing through easier mocking

## Before and After Examples

### Before: Container-based Approach

```typescript
// DI container implementation in di/container.ts
export class Container {
  private static instance: Container;
  private services: Partial<AuthContainer> = {};
  // ... container implementation ...
}

// Retrieving a service in a handler
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    // ... input validation ...
    
    // Get service from container
    const authService = getService(c.env, 'authService');
    const result = await authService.login(data);
    
    // ... response handling ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### After: Factory-based Approach

```typescript
// Factory functions in factory.ts at module root
export function createUserRepository(env: Env): UserRepository {
  return new UserRepository(env);
}

export function createAuthService(env: Env): AuthService {
  const userRepository = createUserRepository(env);
  const passwordResetRepository = createPasswordResetRepository(env);
  const webhookService = createWebhookService(env);
  const emailService = createEmailService(env);
  
  return new AuthService(
    env,
    userRepository,
    passwordResetRepository,
    webhookService,
    emailService
  );
}

// Using factories in a handler
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    // ... input validation ...
    
    // Create service directly
    const authService = createAuthService(c.env);
    const result = await authService.login(data);
    
    // ... response handling ...
  } catch (error) {
    // ... error handling ...
  }
};
```

## Benefits

1. **Improved Cold Start Performance**: 
   - Only creates dependencies needed for the specific request
   - Avoids initializing the entire dependency graph upfront

2. **True Statelessness**:
   - No shared state between requests
   - No singleton instances that could cause data leakage
   - Each request has its own isolated dependency tree

3. **Simplified Testing**:
   - Easy to mock individual dependencies
   - No need to reset container state between tests
   - Clear dependency graph visible in each handler

4. **Better Parallel Processing**:
   - No shared state means no concurrency issues
   - Requests can be processed in parallel without conflicts

## Performance Considerations

1. **Database Connection Pooling**:
   - The underlying database service handles connection pooling
   - Workers connections are automatically managed by Cloudflare

2. **Repeated Instantiation**:
   - Creating services for each request is lightweight
   - The cost of instantiation is minimal compared to actual operations
   - Most expensive operations (DB queries, etc.) are not duplicated

3. **Memory Usage**:
   - No persistent memory usage between requests
   - Garbage collection happens after each request completes

## Migration Path

To migrate existing modules to the new factory-based approach:

1. Run the migration script:
   ```bash
   npm run migrate:dependencies src/modules/your-module
   ```

2. Review the changes made by the script
   - Check that all services are properly imported
   - Ensure factory functions have the correct dependencies

3. Run tests to verify functionality
   - Unit tests should pass without modification
   - Integration tests may need updates if they mock the container

4. Gradually migrate all modules over time

## Best Practices

1. **Keep Factory Functions Simple**:
   - Factory functions should just create and return instances
   - Avoid complex logic in factory functions

2. **Document Dependencies Clearly**:
   - Make it clear what dependencies each service needs
   - Use proper TypeScript typing for all dependencies

3. **Avoid Circular Dependencies**:
   - Design your service boundaries to avoid circular references
   - If circular dependencies exist, refactor the services

4. **Test Both Units and Integration**:
   - Test individual services in isolation
   - Test the integration of services together

## Conclusion

This approach to dependency management aligns perfectly with the serverless, stateless nature of Cloudflare Workers. By creating dependencies directly where they're needed, we ensure optimal performance, proper isolation between requests, and maintainable, testable code. 