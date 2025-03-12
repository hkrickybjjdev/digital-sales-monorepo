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

All API responses include the following headers:
- `X-API-Version`: The version of the API that processed the request
- `X-API-Latest-Version`: The latest available API version

### Deprecation Notices

When an API version is deprecated, responses will include a `Warning` header with information about when the version will be removed and which version to migrate to.

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

All error responses follow a consistent format:
```json
{
  "error": {
    "code": "ErrorCode",
    "message": "A human-readable error message"
  }
}
```

Common error codes:
- `ValidationError` - Invalid input data
- `ResourceNotFound` - Requested resource doesn't exist
- `Unauthorized` - Authentication required or failed
- `Forbidden` - Insufficient permissions
- `InternalServerError` - Server-side error
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

## Architecture

The backend follows a modular monolith architecture pattern, organizing functionality into domain-driven modules while maintaining a single deployment unit for simplicity and performance.

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
  ├── auth/            # Authentication and authorization
  │   ├── controllers/ # RHandler functions for HTTP requests
  │   ├── services/    # Business logic layer
  │   ├── models/      # Zod schemas and type definitions
  │   ├── utils/       # Module-specific utilities
  │   ├── v2/          # v2 API implementation
  │   └── index.ts     # Route definitions and module exports
  ├── pages/           # Page management
  ├── products/        # Digital product handling
  ├── payments/        # Stripe integration
  ├── storage/         # File upload and delivery
  └── analytics/       # Usage tracking and reporting
```

### Pages Module Architecture

The pages module follows a clean architecture pattern:

1. **Models Layer** (`models/schemas.ts`)
   - Defines data structures using Zod schemas
   - Provides type definitions derived from schemas
   - Handles validation rules for all data entities

2. **Repository Layer** (`repositories/`)
   - Handles database operations
   - Provides data access abstraction
   - Implements CRUD operations for each entity
   - Example: `pageRepository.ts`, `contentRepository.ts`, `registrationRepository.ts`

3. **Service Layer** (`services/`)
   - Implements business logic
   - Orchestrates operations across repositories
   - Handles caching and complex operations
   - Example: `PageService.ts`, `ContentService.ts`, `RegistrationService.ts`

4. **Controller Layer** (`controllers/`)
   - Contains handler functions for HTTP requests
   - Validates input using Zod schemas
   - Calls appropriate service methods
   - Formats responses according to API standards
   - Example: `page-handlers.ts`, `content-handlers.ts`, `registration-handlers.ts`

5. **Module Entry Point** (`index.ts`)
   - Defines routes and connects them to handler functions
   - Applies middleware like authentication
   - Exports the module router

This architecture provides clear separation of concerns, making the code more maintainable, testable, and scalable.

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

To clear all data from the users and sessions tables (useful for testing):

```bash
# Clear tables in the local development database
npx wrangler d1 execute DB --local --file=./src/database/clear_tables.sql
# or
npm run db:clear

# Clear tables in the production database
npx wrangler d1 execute DB --file=./src/database/clear_tables.sql
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