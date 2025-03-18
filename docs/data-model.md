# Temporary Pages Platform: Data Model

## Overview

This document outlines the core data structures, relationships, and storage solutions used in the Temporary Pages Platform. The data model is designed to support the platform's key features while maintaining scalability, security, and performance.

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        string id PK
        string email
        string name
        string passwordHash
        timestamp createdAt
        timestamp updatedAt
        timestamp lockedAt
        boolean emailVerified
        integer failedAttempts
    }

    PASSWORD_RESET {
        string id PK
        string userId FK
        string token
        timestamp expiresAt
        boolean used
        timestamp createdAt
        timestamp updatedAt
    }

    TEAM {
        string id PK      
        string name        
        timestamp createdAt
        timestamp updatedAt
    }

    TEAM_MEMBER {
        string id PK
        string teamId FK
        string userId FK
        string role
        timestamp createdAt
        timestamp updatedAt
    }

    PLAN {
        string id PK
        string name
        string description
        boolean isVisible
        JSON features
    }

    PRICE {
        string id PK
        string planId FK
        string productId FK
        string currency
        string interval
        timestamp createdAt
        timestamp updatedAt
        string billingScheme
        string type
    }

    SUBSCRIPTION {
        string id PK
        string teamId FK
        string planId FK
        timestamp startDate
        timestamp endDate
        string status
        string paymentGateway
        string subscriptionId
        timestamp createdAt
        timestamp updatedAt
        timestamp cancelAt
    }
    
    SESSION {
        string id PK
        string userId FK
        timestamp expiresAt
        timestamp createdAt
    }
        
    USER ||--o{ PRODUCT : creates    
    USER ||--o{ TEAM_MEMBER : belongs to
    TEAM ||--o{ TEAM_MEMBER : has
    TEAM ||--o{ SUBSCRIPTION : subscribes to
    PLAN ||--o{ SUBSCRIPTION : provides
    USER ||--o{ SESSION : has
    USER ||--o{ PASSWORD_RESET : requests
```

## Core Entities

### Team

Represents a team of users working together.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| name | String | Team name |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update date |

### TeamMember

Represents a user's membership in a team.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| teamId | UUID (FK) | Reference to team |
| userId | UUID (FK) | Reference to user |
| role | Enum | Role in team ('owner', 'admin', 'member', 'viewer') |
| createdAt | Timestamp | Join date |
| updatedAt | Timestamp | Last update date |

### User

Represents platform users who create and manage content.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| email | String | Email address, used for login |
| name | String | Display name |
| passwordHash | String | Hashed password for authentication |
| createdAt | Timestamp | Account creation date |
| updatedAt | Timestamp | Last account update |
| lockedAt | Timestamp | When the account was locked (NULL if not locked) |
| emailVerified | Boolean | Indicates if the email address has been verified |
| failedAttempts | Integer | Number of consecutive failed login attempts |

### PasswordReset

Represents a password reset request.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| userId | UUID (FK) | Reference to user |
| token | String | Unique reset token |
| expiresAt | Timestamp | Token expiration date |
| used | Boolean | Whether token has been used |
| createdAt | Timestamp | Request creation date |
| updatedAt | Timestamp | Last update date |

### Plan

Represents a pricing plan.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| name | String | Plan name (e.g., Free, Basic, Premium) |
| description | String | Plan details |
| isVisible | Boolean | Whether the plan is visible to users |
| features | JSON | Plan-specific features and limits |

### Price

Represents different pricing tiers, billing intervals, and currencies for a plan or product.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| planId | UUID (FK) | Reference to plan (if applicable) |
| productId | UUID (FK) | Reference to product (if applicable) |
| currency | String | ISO currency code (e.g., USD) |
| interval | String | Billing interval (e.g., month, year) |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update date |
| billingScheme | String | Indicates how the price is determined. Common values: `flat_rate`: A fixed price, regardless of usage. `per_unit`: Price is calculated based on the quantity of units consumed. `tiered`: Price varies based on usage tiers (e.g., different prices for the first 100 units, the next 1000 units, etc.). `volume`: Similar to tiered, but the price for all units is determined by the tier reached. |
| type | String | Type of price. Common values: `recurring`: A price that is charged on a regular interval (e.g., monthly, yearly). `one_time`: A price that is charged only once. `usage`: A price that is based on usage (e.g., pay-as-you-go). |

### Subscription

Represents a user's subscription to a plan, including free plans.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| teamId | UUID (FK) | Reference to team |
| planId | UUID (FK) | Reference to plan |
| startDate | Timestamp | Subscription start date |
| endDate | Timestamp | Subscription end date |
| status | String | Subscription status (e.g., active, canceled, past_due, free) |
| paymentGateway | String | Payment gateway used (e.g., stripe, paypal) |
| subscriptionId | String | Payment gateway subscription ID |
| createdAt | Timestamp | Subscription creation date |
| updatedAt | Timestamp | Last Subscription update |
| cancelAt | Timestamp | When the subscription was canceled (NULL if not canceled) |

### Session

Represents a user session for authentication.

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Primary identifier |
| userId | TEXT (FK) | Reference to user |
| expiresAt | INTEGER | Session expiration timestamp |
| createdAt | INTEGER | Session creation timestamp |

## Storage Solutions

### Structured Data

Core entity data is stored in a relational database with the following considerations:

- **Read-Heavy Tables**: Orders, Registrations
  - Optimized for high read throughput
  - Consider read replicas for scaling

- **Write-Heavy Tables**: OrderEvents, DownloadAttempts
  - Potential use of time-series optimized storage
  - Consider sharding strategies for high-volume tables

### File Storage (Cloudflare R2)

Digital products are stored in Cloudflare R2 with the following organization:

```
r2://
  ├── users/
  │   ├── {userId}/
  │   │   ├── products/
  │   │   │   ├── {productId}/
  │   │   │   │   ├── original/{fileName}
  │   │   │   │   ├── preview/{fileName}
  │   │   ├── pages/
  │   │   │   ├── {pageId}/
  │   │   │   │   ├── assets/{assetName}
```

### Metadata Caching (Cloudflare KV)

Frequently accessed read-only data is cached at the edge:

- Active page metadata and settings
- Product information for active sales
- Download token validity
- Page expiration status

### Transactional Workflow

1. **Pre-Purchase/Registration**:
   - Page visits are anonymous
   - Minimal data collection before user action

2. **Purchase Process** (for sales pages):
   - Order created with 'processing' status
   - Payment processed via Stripe
   - On success, order status updated to 'completed'
   - Download token generated with security constraints

3. **Registration Process** (for signup/event pages):
   - Validate form data
   - Store registration information
   - Send confirmation email/SMS
   - Update registration count metrics

## Team-Based Access Control

The platform employs a team-based access control model where permissions are determined by a user's role within a team. Each user can be a member of multiple teams with different roles in each team.

### Team Member Roles

Team members can have one of four predefined roles:
- **Owner**: Full control over team settings and members
- **Admin**: Can manage pages, products, and team members
- **Member**: Can create and edit content
- **Viewer**: Read-only access to team content

### Role Permissions

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| View content | ✓ | ✓ | ✓ | ✓ |
| Create/edit pages | ✓ | ✓ | ✓ | - |
| Manage products | ✓ | ✓ | ✓ | - |
| View analytics | ✓ | ✓ | ✓ | ✓ |
| Manage team members | ✓ | ✓ | - | - |
| Delete team | ✓ | - | - | - |
| Billing management | ✓ | - | - | - |

## Team Plan Considerations

For teams not on the Enterprise plan:
- Limited number of team members based on plan tier
- Restricted access to advanced collaboration features
- Standard team naming without custom branding options
- Pre-defined role templates without customization

## Data Retention and Compliance

- Customer IP addresses: Stored for 30 days (compliance with GDPR/CCPA)
- Order data: Retained for 7 years (tax compliance)
- Registration data: Retained until explicitly deleted by user or registrant
- Security logs: Retained for 180 days

## Indexing Strategy

### Primary Indices

- `user.email`: For authentication and lookup
- `page.shortId`: For public URL resolution
- `order.customerId`: For customer order history
- `registration.email`: For lead management
- `passwordReset.token`: For lookup during password reset process

### Secondary Indices

- `product.userId`: For listing user's products
- `page.userId`: For listing user's pages
- `page.expiresAt`: For expiration checks
- `registration.pageId`: For campaign performance analysis
- `passwordReset.userId`: For managing user's reset requests
- `passwordReset.expiresAt`: For cleanup of expired tokens

## Data Migration and Versioning

- Schema versioning follows semantic versioning
- Migrations are applied through a controlled CI/CD process
- Backward compatibility maintained for at least one previous version