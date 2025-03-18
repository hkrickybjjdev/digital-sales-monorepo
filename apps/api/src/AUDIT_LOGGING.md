# Audit Logging System

This document explains the updated audit logging system and how to properly use it in your repositories and controllers.

## AuditLog Table Structure

The AuditLog table now uses an enhanced schema with more detailed fields:

| Field | Type | Description |
|-------|------|-------------|
| `logId` | INTEGER | Primary key, auto-incrementing identifier |
| `userId` | TEXT | The ID of the user who performed the action (nullable) |
| `eventType` | TEXT | A descriptive name for the event (e.g., 'user_created', 'page_updated') |
| `resourceType` | TEXT | The type of resource affected (e.g., 'User', 'Page', 'Subscription') |
| `resourceId` | TEXT | The unique identifier of the affected resource |
| `timestamp` | INTEGER | When the event occurred (milliseconds since epoch) |
| `details` | TEXT | JSON-encoded additional information about the event |
| `ipAddress` | TEXT | The IP address of the client |
| `userAgent` | TEXT | The user agent string |
| `sessionId` | TEXT | Session identifier |
| `createdAt` | INTEGER | When the log entry was created |
| `updatedAt` | INTEGER | When the log entry was last updated |
| `outcome` | TEXT | Result of the action (e.g., 'success', 'failure', 'pending') |

## How to Use Audit Logging

### 1. In Repository Methods

When implementing repository methods that modify data, use the `executeWithAudit` method:

```typescript
async createUser(user: UserData, context?: RequestContext): Promise<User> {
  const id = generateUUID();
  const now = Date.now();
  
  await this.dbService.executeWithAudit({
    sql: "INSERT INTO User (...) VALUES (...)",
    params: [...]
  }, {
    eventType: 'user_created',       // Use descriptive event types
    userId: context?.userId,         // User who performed the action
    resourceType: 'User',            // Type of resource affected
    resourceId: id,                  // ID of specific resource
    details: JSON.stringify({...}),  // Additional details as needed
    outcome: 'success'               // Result of the operation
  }, context);                       // Pass context for IP, user agent, etc.
  
  return { /* user data */ };
}
```

### 2. Extracting Request Context in Controllers

Use the provided utility to extract context information from requests:

```typescript
import { getRequestContext } from '../utils/request-context';

async function createUserHandler(c: Context) {
  const requestContext = getRequestContext(c);
  const userData = await c.req.json();
  
  const userRepository = new UserRepository(c.env);
  const user = await userRepository.createUser(userData, requestContext);
  
  return c.json({ user });
}
```

## Best Practices

1. **Event Types**: Use consistent, descriptive naming for event types:
   - Use lowercase with underscores (`user_created`, not `UserCreated` or `createUser`)
   - Follow the pattern `{resource}_{action}` (e.g., `user_password_updated`, `page_content_deleted`)
   - Use past tense for the action part (`created`, not `create`)

2. **Outcomes**: Always include an outcome, typically one of:
   - `success` - The operation completed successfully
   - `failure` - The operation failed (include error details in the `details` field)
   - `pending` - The operation has been initiated but not completed
   - `cancelled` - The operation was cancelled

3. **Context**: Always pass the request context to repository methods to capture client information.

4. **Sensitive Data**: Never include sensitive information in the `details` field:
   - No passwords or authentication tokens
   - No full credit card numbers or security codes
   - Limit personal data to what's necessary for the audit trail

5. **Performance**: Remember that each audit log entry requires a database write. In very high-volume operations, consider:
   - Batching audit logs for bulk operations
   - Using a queue for audit logging in performance-critical paths
   - Selective audit logging for read-heavy operations

## Common Event Types

Here's a list of standard event types to use for consistency:

### User-Related
- `user_created`
- `user_updated`
- `user_deleted`
- `user_password_updated`
- `user_logged_in`
- `user_logged_out`
- `user_login_failed`
- `user_account_locked`
- `user_account_unlocked`
- `user_password_reset_requested`
- `user_password_reset_completed`

### Data Object-Related
- `{resource}_created`
- `{resource}_updated`
- `{resource}_deleted`
- `{resource}_published`
- `{resource}_unpublished`
- `{resource}_archived`
- `{resource}_restored`

### Permission-Related
- `permission_granted`
- `permission_revoked`
- `access_denied`

### System Events
- `system_backup_created`
- `system_restored`
- `system_error`
- `scheduled_job_started`
- `scheduled_job_completed` 