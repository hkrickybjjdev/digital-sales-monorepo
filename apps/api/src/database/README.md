# Centralized Database Service

This directory contains the centralized database service for the API. This service acts as a single point of entry for all database interactions, providing the following benefits:

- **Audit Logging**: All database changes are automatically logged for audit purposes
- **Abstraction**: Repository implementations don't need to know about the underlying database specifics
- **Consistency**: Common database access patterns are standardized
- **Error Handling**: Consistent error handling for database operations
- **Transactions**: Simplified transaction management
- **Retry Capability**: Automatic retry with exponential backoff for transient failures

## How to Use

### 1. Obtaining the Database Service

The database service is accessible through the DatabaseFactory:

```typescript
import { DatabaseFactory } from '../database/databaseFactory';

export class MyRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  // Repository methods...
}
```

### 2. Database Operations

#### Query for a Single Item

```typescript
async getItemById(id: string): Promise<Item | null> {
  return this.dbService.queryOne<Item>({
    sql: 'SELECT * FROM Items WHERE id = ?',
    params: [id]
  });
}
```

#### Query for Multiple Items

```typescript
async getAllItems(): Promise<Item[]> {
  return this.dbService.queryMany<Item>({
    sql: 'SELECT * FROM Items'
  });
}
```

#### Execute an Update/Insert/Delete with Audit Logging

```typescript
async createItem(data: NewItem): Promise<string> {
  const id = generateUUID();
  const now = Date.now();

  await this.dbService.executeWithAudit({
    sql: 'INSERT INTO Items (id, name, createdAt) VALUES (?, ?, ?)',
    params: [id, data.name, now]
  }, {
    action: 'CREATE',
    userId: data.userId,
    resourceType: 'Item',
    resourceId: id,
    details: JSON.stringify(data)
  });

  return id;
}
```

#### Transactions

```typescript
async complexOperation(data: SomeData): Promise<Result> {
  return this.dbService.transaction(async (tx) => {
    // Multiple database operations that need to be atomic
    const id = generateUUID();
    
    await tx.execute({
      sql: 'INSERT INTO MainTable (id, name) VALUES (?, ?)',
      params: [id, data.name]
    });

    await tx.execute({
      sql: 'INSERT INTO RelatedTable (mainId, value) VALUES (?, ?)',
      params: [id, data.value]
    });

    return { id };
  });
}
```

## Schema

The database service relies on an audit log table. Make sure the schema includes:

```sql
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  userId TEXT,
  resourceType TEXT NOT NULL,
  resourceId TEXT,
  details TEXT,
  timestamp INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON "AuditLog"(userId);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON "AuditLog"(resourceType, resourceId);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON "AuditLog"(timestamp);
```

# Database Abstraction Layer

This directory contains the database abstraction layer that provides a common interface for different SQL database providers. The primary goal is to allow for easy switching between different database providers without changing application code.

## Architecture

The database layer follows a clean architecture approach with:

- **Interface**: Defines the contract for database operations
- **Implementation**: Concrete classes that implement the interface for specific database providers
- **Factory**: Creates and manages database instances using dependency injection

## Core Components

### SQLDatabase Interface (`sqlDatabase.ts`)

The core interface that defines the contract for all database implementations:

```typescript
export interface SQLDatabase {
  queryOne<T>(query: QueryParams): Promise<T | null>;
  queryMany<T>(query: QueryParams): Promise<T[]>;
  execute(query: QueryParams, retryOptions?: RetryConfig): Promise<boolean>;
  executeWithAudit(query: QueryParams, auditInfo: AuditInfo, context?: RequestContext): Promise<boolean>;
  createAuditLog(auditInfo: AuditInfo, context?: RequestContext): Promise<boolean>;
  transaction<T>(callback: (tx: SQLDatabase) => Promise<T>): Promise<T>;
  getRawDatabase(): unknown;
}
```

### CloudflareD1Database (`cloudflareD1Database.ts`)

Implementation of the SQLDatabase interface for Cloudflare D1:

```typescript
export class CloudflareD1Database implements SQLDatabase {
  // Implementation for Cloudflare D1
}
```

### KVStore (`kvStore.ts`)

Interface and implementation for key-value storage operations:

```typescript
export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}

export class CloudflareKVStore implements KeyValueStore {
  // Implementation for Cloudflare KV
}
```

### DatabaseFactory (`databaseFactory.ts`)

Factory class that manages the creation and dependency injection of database implementations:

```typescript
export class DatabaseFactory {
  static getInstance(env: Env, config?: RetryConfig): SQLDatabase;
  static setImplementation(impl: (env: Env, config?: RetryConfig) => SQLDatabase): void;
  // ...
}
```

## Retry Capability and Exponential Backoff

Both the CloudflareD1Database and CloudflareKVStore implementations include built-in retry capability with exponential backoff for handling transient failures. This functionality is centralized in utility functions.

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts?: number;      // Maximum retry attempts before giving up
  initialDelayMs?: number;   // Initial delay before first retry
  maxDelayMs?: number;       // Maximum delay cap
  backoffFactor?: number;    // Multiplier for increasing delay on each retry
}
```

Default configuration:
- 3 maximum attempts
- 100ms initial delay
- 5000ms maximum delay cap
- Backoff factor of 2 (exponential growth)

### Using Retry Options

You can customize retry behavior when calling database methods:

```typescript
// Custom retry settings for a specific high-priority operation
const result = await db.queryOne<User>(
  {
    sql: 'SELECT * FROM Users WHERE id = ?',
    params: [userId]
  },
  {
    maxAttempts: 5,      // Try up to 5 times
    initialDelayMs: 50,  // Start with a shorter delay
    backoffFactor: 3     // More aggressive backoff
  }
);
```

### Centralized Implementation

The retry logic is implemented in the shared utility functions:

- `withRetry<T>`: Generic function to handle retry logic with exponential backoff
- `isRetryableDatabaseError`: Detects which database errors should be retried
- `isRetryableKVError`: Detects which KV storage errors should be retried

## Usage Examples

### Basic Usage

```typescript
import { DatabaseFactory } from '../database/databaseFactory';
import { SQLDatabase } from '../database/sqlDatabase';
import { Env } from '../types';

class UserService {
  private db: SQLDatabase;
  
  constructor(env: Env) {
    this.db = DatabaseFactory.getInstance(env);
  }
  
  async getUser(id: string): Promise<User | null> {
    return this.db.queryOne<User>({
      sql: 'SELECT * FROM User WHERE id = ?',
      params: [id]
    });
  }
}
```

### Implementing a New Database Provider

To add support for a new database provider (e.g., PostgreSQL):

1. Create a new implementation of the SQLDatabase interface:

```typescript
export class PostgreSQLDatabase implements SQLDatabase {
  // Implement all required methods
}
```

2. Set the implementation in the DatabaseFactory:

```typescript
DatabaseFactory.setImplementation((env) => new PostgreSQLDatabase(env.POSTGRES_CLIENT));
```

## Features

- **Type-safety**: Full TypeScript support with generics for query results
- **Query retry**: Built-in retry mechanism for transient database errors 
- **Exponential backoff**: Smart handling of retries with increasing delays
- **Audit logging**: Integrated audit logging for database operations
- **Transactions**: Support for database transactions
- **Error handling**: Consistent error handling across database operations

## Best Practices

1. Always use the SQLDatabase interface in your repositories, not the concrete implementations
2. Use the DatabaseFactory to get database instances
3. For testing, create mock implementations of the SQLDatabase interface
4. Use transactions for operations that need to be atomic
5. Configure retry options based on the criticality of the operation
6. Use shorter retry delays for user-facing operations and longer delays for background tasks