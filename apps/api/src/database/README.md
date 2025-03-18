# Centralized Database Service

This directory contains the centralized database service for the API. This service acts as a single point of entry for all database interactions, providing the following benefits:

- **Audit Logging**: All database changes are automatically logged for audit purposes
- **Abstraction**: Repository implementations don't need to know about the underlying database specifics
- **Consistency**: Common database access patterns are standardized
- **Error Handling**: Consistent error handling for database operations
- **Transactions**: Simplified transaction management

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