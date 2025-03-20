# Dependency Management in Cloudflare Workers

## Overview

This document outlines our approach to dependency management in the Cloudflare Workers environment, prioritizing statelessness and optimizing for cold starts.

## Key Principles

1. **Statelessness**: Cloudflare Workers are designed to be stateless. Each request handler should be self-contained and not rely on shared state.
2. **Cold Start Optimization**: By creating dependencies when needed, we reduce the overhead during cold starts.
3. **Simplicity**: Direct dependency creation is easier to reason about than complex DI containers.

## Implementation

### Factory Functions

Instead of relying on a singleton container to manage dependencies, we use factory functions to create service instances directly where they're needed:

```typescript
// Create a user repository instance
export function createUserRepository(env: Env): UserRepository {
  return new UserRepository(env);
}

// Create an auth service instance with its dependencies
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
```

### Direct Creation in Handlers

In request handlers, dependencies are created directly:

```typescript
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get and validate the request body
    // ...
    
    // Create the auth service directly in the handler
    const authService = createAuthService(c.env);
    const result = await authService.login(data);
    
    // Process the result
    // ...
  } catch (error) {
    // Handle errors
  }
};
```

## Benefits

1. **Improved Cold Start Performance**: By creating dependencies on-demand rather than initializing everything at once, we reduce the time needed for cold starts.
2. **True Statelessness**: Each request creates its own dependency chain, ensuring no shared state between requests.
3. **Simplified Testing**: Dependencies can be easily mocked without dealing with complex container state.
4. **Parallel Processing**: Requests can be handled in parallel without concerns about shared state.

## Considerations

1. **Service Reuse**: We create new instances of services for each request. If service initialization is expensive, consider using caching mechanisms that respect the stateless nature of Workers.
2. **Resource Management**: Services may establish connections to external resources. Ensure these are properly closed when done.
3. **Backward Compatibility**: The `getService` function maintains compatibility with existing code while we transition to the new approach.

## Migration Path

To migrate from the container-based DI approach to this more direct approach:

1. Update service factory functions in the DI module
2. Modify handlers to create dependencies directly
3. For each module, update middleware to follow the same pattern
4. Gradually phase out container references 