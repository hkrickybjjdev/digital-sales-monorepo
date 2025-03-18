# TempPages API

This is the backend API for TempPages, a digital sales platform.

## API Versioning

The API uses versioning to ensure backward compatibility as the API evolves. All API endpoints are prefixed with a version identifier.

### Version Format

API versions follow this format:
```
/api/v{MAJOR_VERSION}/{resource}
```

For example:
- `/api/v1/auth/login`
- `/api/v2/auth/login`
- `/api/v1/pages/123`

### Available Versions

- **v1** - Initial API version (current stable version)
- **v2** - Enhanced API with additional security features (beta)

### Version Differences

#### v1 to v2 Changes

The v2 API includes several enhancements:

**Auth Module:**
- Added multi-factor authentication (MFA) support
- Enhanced security with device tracking
- Improved JWT handling with shorter expiration times
- Added support for social login providers

**Endpoints:**
- `/api/v2/auth/login` - Enhanced login with MFA support
- `/api/v2/auth/mfa/verify` - New endpoint for MFA verification

### Latest Version

You can also use the `/api/latest` endpoint to always access the most recent stable version:
```
/api/latest/{resource}
```

### Version Headers

All API responses include the following headers that follow Azure REST API conventions:
- `api-supported-versions`: List of all supported API versions (e.g., "1.0.0, 2.0.0")
- `api-version`: The version of the API that processed the request (e.g., "1.0.0")
- `api-deprecated-versions`: List of deprecated API versions, if any

### Deprecation Notices

When an API version is deprecated, responses will include a `Warning` header with information about when the version will be removed and which version to migrate to:

```
Warning: 299 - "This API version is deprecated and will be removed on {sunset-date}. Please migrate to v{latest-version}."
```

## Documentation

For full API documentation, visit [https://docs.tempopages.com/api](https://docs.tempopages.com/api)

## Response Format

All API responses follow Azure REST API conventions for consistency and standards compliance:

### Success Responses

Standard response format:
```json
{
  "property1": "value1",
  "property2": "value2"
}
```

### Paginated Responses

Paginated responses follow Azure's format with value array and nextLink:
```json
{
  "value": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "count": 2,
  "nextLink": "https://api.tempopages.com/resources?page=2&pageSize=2"
}
```

### Error Responses

All error responses follow Azure REST API conventions with a consistent format:
```json
{
  "error": {
    "code": "ErrorCode",
    "message": "A human-readable error message"
  }
}
```

For 500 Internal Server errors, additional debugging information is included in non-production environments:
```json
{
  "error": {
    "code": "InternalServerError",
    "message": "An error occurred processing your request",
    "innererror": {
      "code": "ErrorName",
      "stackTrace": "Detailed stack trace (only in non-production)"
    }
  }
}
```

Common error codes:
- `ValidationError` - Invalid input data
- `ResourceNotFound` - Requested resource doesn't exist
- `Unauthorized` - Authentication required or failed
- `Forbidden` - Insufficient permissions
- `InternalServerError` - Server-side error
- `UnsupportedApiVersion` - Requested API version is not supported
- `PageExpired` - Requested page has expired
- `PageNotLaunched` - Page is not yet available
- `PageInactive` - Page is no longer active
- `RegistrationLimitReached` - Event registration limit reached

### Headers

All responses include CORS and API version headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
api-supported-versions: 1.0.0, 2.0.0
api-version: 1.0.0
api-deprecated-versions: (if any versions are deprecated)
```

## Development

### Environment Variables

The API requires the following environment variables:
- `ENVIRONMENT`: The current environment (development, staging, production)
- `JWT_SECRET`: Secret for JWT token generation
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Linting

This project uses ESLint for linting TypeScript code.

### Running ESLint

To run ESLint and check for linting errors:

```bash
npm run lint
```

### Fixing Linting Errors

To automatically fix linting errors:

```bash
npm run lint:fix
```

## Formatting

This project uses Prettier for code formatting.

### Running Prettier

To format the code:

```bash
npm run format
```

### Checking Formatting

To check if the code is formatted correctly without applying changes:

```bash
npm run format:check
```

## Testing

This project uses Jest for unit testing.

### Running Tests

To run the tests:

```bash
npm run test
```

### Running Tests in Watch Mode

To run the tests in watch mode:

```bash
npm run test:watch
```

### Generating Coverage Reports

To generate coverage reports:

```bash
npm run test:coverage
```

## End-to-End Testing

This project uses Playwright for end-to-end testing.

### Running End-to-End Tests

To run the end-to-end tests:

```bash
npm run test:e2e
```

### Running End-to-End Tests in UI Mode

To run the end-to-end tests in UI mode:

```bash
npm run test:e2e:ui
```

## Architecture

The backend follows a modular monolith architecture pattern, organizing functionality into domain-driven modules while maintaining a single deployment unit for simplicity and performance.

### Dependency Injection

The API uses a simple dependency injection pattern to improve testability, maintainability, and decoupling of components. Currently implemented in the Auth module, this pattern:

1. **Defines Interfaces**: Service and repository contracts are defined in interface files
2. **Creates Singletons**: Stateless services are implemented as singletons to improve performance
3. **Uses Containers**: Module-specific DI containers manage instance creation and dependencies
4. **Environment Aware**: Handles environment changes in serverless contexts

#### DI Container Structure

```typescript
// Module-specific container interface
interface AuthContainer {
  userRepository: IUserRepository;
  authService: IAuthService;
}

// Factory function to get container
function getAuthContainer(env: Env): AuthContainer {
  // Create or retrieve singleton instances
  // Return container with all dependencies
}
```

#### Usage Example

```typescript
// In a handler function
const container = getAuthContainer(c.env);
const result = await container.authService.login(data);
```

#### Benefits
- **Testability**: Easy to mock dependencies for unit testing
- **Maintainability**: Clear dependency graph and separation of concerns
- **Flexibility**: Simple to swap implementations that follow the same interface
- **Performance**: Singleton pattern for stateless services reduces instantiation overhead

## Getting Started

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup

```bash
# Install dependencies
npm install

# Set up local environment variables
# Create a .dev.vars file with the following content:
# JWT_SECRET=your_jwt_secret_for_local_development
# STRIPE_SECRET_KEY=sk_test_placeholder
# STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Initialize the database (required before first run)
npx wrangler d1 execute DB --local --file=./src/database/schema.sql

# Start development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

## Module Structure

Each domain module is organized in a consistent structure:

```
modules/
  ├── auth/                 # Authentication and authorization
  │   ├── controllers/      # Handler functions for HTTP requests
  │   ├── services/         # Business logic layer
  │   │   └── interfaces.ts # Service and repository interfaces
  │   ├── models/           # Zod schemas and type definitions
  │   ├── utils/            # Module-specific utilities
  │   ├── di/               # Dependency injection containers
  │   │   └── container.ts  # DI container implementation
  │   ├── v2/               # v2 API implementation
  │   └── index.ts          # Route definitions and module exports
  ├── pages/                # Page management
  ├── products/             # Digital product handling
  ├── payments/             # Stripe integration
  ├── teams/                # Team and subscription management
  │   ├── webhooks/         # Integration with other modules
  ├── storage/              # File upload and delivery
  └── analytics/            # Usage tracking and reporting
```

### Pages Module Architecture

The pages module follows a clean architecture pattern:

1. **Models Layer** (`models/schemas.ts`)
   - Defines data structures using Zod schemas for validation and type safety.
   - Provides type definitions derived from schemas, ensuring type consistency across the application.
   - Centralizes the definition of data shapes, making it easier to manage and update data structures.

2. **Repository Layer** (`repositories/`)
   - Handles database operations
   - Provides data access abstraction
   - Implements CRUD operations for each entity
   - Uses `D1Database`, passed in the constructor
   - Example: `pageRepository.ts`, `contentRepository.ts`, `registrationRepository.ts`

3. **Service Layer** (`services/`)
   - Implements business logic
   - Orchestrates operations across repositories
   - Uses repositories, passed in the constructor
   - Should not call any db function directly, but instead use the repository
   - Handles caching and complex operations
   - Example: `PageService.ts`, `ContentService.ts`, `RegistrationService.ts`

4. **Controller Layer** (`controllers/`)
   - Contains handler functions for HTTP requests
   - Validates input using Zod schemas
   - Calls appropriate service methods
   - Formats responses according to API standards
   - Example: `pageHandlers.ts`, `contentHandlers.ts`, `registrationHandlers.ts`

5. **Dependency Injection** (`di/container.ts`)
   - Manages dependencies between different layers of the application.
   - Implements a simple container pattern to provide instances of repositories and services.
   - Promotes loose coupling and improves testability by allowing dependencies to be easily swapped or mocked.
   - Uses singleton instances for stateless services to optimize performance.

6. **Module Entry Point** (`index.ts`)
   - Defines routes and connects them to handler functions
   - Applies middleware like authentication
   - Exports the module router

This architecture provides clear separation of concerns, making the code more maintainable, testable, and scalable.

#### Integration Endpoints

The modules/teams/webhooks/authWebhookHandlers.ts exposes webhook endpoints to seamlessly integrate with other modules:

##### Auth Module Webhooks
```
POST /api/v1/teams/webhooks/auth/user-created
POST /api/v1/teams/webhooks/auth/user-updated
POST /api/v1/teams/webhooks/auth/user-deleted
```

These endpoints handle user lifecycle events:

- **User Registration Webhook** (`/user-created`)
  - Automatically creates a new team for the user
  - Adds the user as the team owner
  - Provisions a free subscription plan
  - Example payload:
  ```json
  {
    "event": "user.created",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": 1742052443000
    }
  }
  ```

- **User Update Webhook** (`/user-updated`)
  - Updates team member information when user details change
  - Ensures team member data stays in sync with user data
  - Example payload:
  ```json
  {
    "event": "user.updated",
    "user": {
      "id": "user_123",
      "email": "updated@example.com",
      "name": "John Updated",
      "updatedAt": 1742052443000
    },
    "previous": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

- **User Deletion Webhook** (`/user-deleted`)
  - Handles user account deletion
  - Transfers team ownership if possible, or archives the team
  - Cancels subscriptions associated with the user
  - Example payload:
  ```json
  {
    "event": "user.deleted",
    "user": {
      "id": "user_123",
      "deletedAt": 1742052443000
    }
  }
  ```

#### Auto-Provisioning Flow

When a new user registers:

1. Auth module emits a `user.created` event to the webhook endpoint
2. TeamService creates a new team with the user as owner
3. TeamMemberService adds the user as a team member with admin role
4. SubscriptionService provisions a free subscription plan
5. The user can immediately access the platform with their team and free plan

This zero-friction onboarding experience allows users to start using the platform immediately after registration, with the option to upgrade to paid plans later.

## Database

The API uses Cloudflare D1 (SQLite) for data storage. The database schema is defined in `src/database/schema.sql`.

### Database Initialization

Before running the application for the first time, you need to initialize the database with the schema:

```bash
# Initialize the local development database
npx wrangler d1 execute DB --local --file=./src/database/schema.sql
# or
npm run db:init

# Initialize the production database (when deploying)
npx wrangler d1 execute DB --file=./src/database/schema.sql
```

### Database Management

#### Clearing Tables

To clear all data from the tables (useful for testing):

```bash
# Clear tables in the local development database
npx wrangler d1 execute DB --local --file=./src/database/clear_tables.sql
# or
npm run db:clear

# Clear tables in the production database
npx wrangler d1 execute DB --file=./src/database/clear_tables.sql
```

#### Dropping Tables

To completely remove all tables from the database:

```bash
# Drop all tables in the local development database
npx wrangler d1 execute DB --local --file=./src/database/drop_tables.sql
# or
npm run db:drop

# Drop all tables in the production database
npx wrangler d1 execute DB --file=./src/database/drop_tables.sql
```

## Environment Variables

### Local Development

For local development, create a `.dev.vars` file in the root of the API project with the following variables:

```
# Required for JWT authentication
JWT_SECRET=your_jwt_secret_for_local_development

# Required for Stripe integration (can use placeholders for local dev)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

### Production

For production deployment, set these environment variables using Wrangler secrets:

```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set Stripe keys
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

Other environment variables:

```
# Auth
JWT_SECRET=your_jwt_secret

# Cloudflare
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_R2_BUCKET=your-r2-bucket-name

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## API Documentation

API documentation is available at `/docs` when running the development server.

## Centralized Database Access

This API now uses a centralized database service to manage all database interactions, providing the following benefits:

### Key Features

1. **Centralized Database Access**
   - All database interactions go through the `DatabaseService`
   - Repository classes no longer directly use D1Database
   - Common patterns for querying and updating data

2. **Automatic Audit Logging**
   - All write operations can be automatically logged
   - Detailed tracking of who changed what and when
   - Support for audit compliance requirements

3. **Transaction Support**
   - Simplified transaction API
   - Automatic rollback on errors
   - Better data consistency

### How to Update Repositories

When creating or updating a repository class, follow these steps:

1. Import the database factory:
   ```typescript
   import { DatabaseFactory } from '../../database/databaseFactory';
   import { DatabaseService } from '../../database/databaseService';
   ```

2. Initialize the database service in your constructor:
   ```typescript
   export class MyRepository {
     private dbService: DatabaseService;

     constructor(env: Env) {
       this.dbService = DatabaseFactory.getInstance(env);
     }
     
     // Repository methods
   }
   ```

3. Use the database service methods:
   - `queryOne<T>()` - For getting a single record
   - `queryMany<T>()` - For getting multiple records
   - `execute()` - For operations without audit logging
   - `executeWithAudit()` - For operations with audit logging
   - `transaction()` - For atomic operations

See the [Database Service README](src/database/README.md) for detailed usage examples.