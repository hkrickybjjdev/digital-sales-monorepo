# Repository Migration Guide

This guide provides instructions for updating repository classes to follow our new dependency injection pattern, where database instances are passed directly to repositories rather than created inside them.

## Repository Pattern Changes

### Before:

```typescript
import { DatabaseFactory } from '../../database/databaseFactory';
import { SQLDatabase } from '../../database/sqlDatabase';
import { Env } from '../../types';

export class UserRepository {
  private dbService: SQLDatabase;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  // Repository methods
}
```

### After:

```typescript
import { SQLDatabase } from '../../database/sqlDatabase';

export class UserRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  // Repository methods
}
```

## Factory Function Changes

### Before:

```typescript
export function createUserRepository(env: Env): UserRepository {
  return new UserRepository(env);
}

export function createAuthService(env: Env): AuthService {
  const userRepository = createUserRepository(env);
  return new AuthService(env, userRepository);
}
```

### After:

```typescript
import { createDatabase } from '../../database/databaseFactory';

export function createUserRepository(env: Env): UserRepository {
  const dbService = createDatabase(env);
  return new UserRepository(dbService);
}

export function createAuthService(env: Env): AuthService {
  const dbService = createDatabase(env);
  const userRepository = createUserRepository(env);
  return new AuthService(userRepository);
}
```

## Handler Changes

### Before:

```typescript
export const getUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('id');
    const userRepository = createUserRepository(c.env);
    const user = await userRepository.getUserById(userId);
    return formatResponse(c, { user });
  } catch (error) {
    return formatError(c, error.message);
  }
};
```

### After:

```typescript
export const getUser = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('id');
    const userRepository = createUserRepository(c.env);
    const user = await userRepository.getUserById(userId);
    return formatResponse(c, { user });
  } catch (error) {
    return formatError(c, error.message);
  }
};
```

Note: The handler code doesn't change since it uses the factory functions, which now internally handle database creation.

## Example Repository Implementation

```typescript
import { SQLDatabase } from '../../database/sqlDatabase';
import { User, UserCreate } from '../models/schemas';

export class UserRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  async getUserById(id: string): Promise<User | null> {
    return this.dbService.queryOne<User>({
      sql: 'SELECT * FROM User WHERE id = ?',
      params: [id]
    });
  }

  async createUser(user: UserCreate): Promise<User> {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await this.dbService.execute({
      sql: `INSERT INTO User (id, name, email, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?)`,
      params: [id, user.name, user.email, now, now]
    });
    
    return {
      id,
      name: user.name,
      email: user.email,
      createdAt: now,
      updatedAt: now
    };
  }
}
```

## Example Factory Implementation

```typescript
import { createDatabase } from '../../database/databaseFactory';
import { Env } from '../../types';
import { UserRepository } from './repositories/userRepository';
import { AuthService } from './services/authService';

export function createUserRepository(env: Env): UserRepository {
  const dbService = createDatabase(env);
  return new UserRepository(dbService);
}

export function createAuthService(env: Env): AuthService {
  const userRepository = createUserRepository(env);
  return new AuthService(userRepository);
}
```

## Advantages of This Approach

1. **Better Testability**: Repositories can be easily tested by passing a mock database
2. **Clearer Dependencies**: Makes dependencies explicit through constructor parameters
3. **Stateless Design**: Aligns with Cloudflare Workers' stateless execution model
4. **Improved Performance**: Creates fresh instances for each request, avoiding shared state issues

## Migration Checklist

For each repository:

1. Update constructor to accept SQLDatabase instead of Env
2. Remove DatabaseFactory.getInstance call from constructor
3. Update factory functions to create and pass database instance
4. Update tests to provide database mocks directly to repositories 