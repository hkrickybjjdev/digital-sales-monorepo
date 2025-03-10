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
        timestamp createdAt
        timestamp updatedAt
        object stripeAccount
    }
    
    PRODUCT {
        string id PK
        string userId FK
        string name
        string description
        int priceInCents
        string currency
        timestamp createdAt
        timestamp updatedAt
        timestamp expiresAt
        boolean isActive
    }
    
    FILE {
        string id PK
        string productId FK
        string fileName
        string fileType
        string storageKey
        int fileSizeBytes
        timestamp uploadedAt
    }
    
    PAGE {
        string id PK
        string shortId
        string userId FK
        string type
        timestamp createdAt
        timestamp expiresAt
        timestamp launchAt
        boolean isActive
        object customization
        object settings
    }
    
    PAGE_CONTENT {
        string id PK
        string pageId FK
        string contentType
        string productId FK
        string title
        string description
        int priceInCents
        string currency
        object metadata
    }
    
    ORDER {
        string id PK
        string pageId FK
        string productId FK
        string customerId
        string paymentId
        int amountPaid
        string currency
        timestamp createdAt
        string status
        int downloadAttempts
        timestamp lastDownloadAt
    }
    
    REGISTRATION {
        string id PK
        string pageId FK
        string email
        string name
        string phone
        timestamp registeredAt
        object customFields
    }
    
    USER ||--o{ PRODUCT : creates
    USER ||--o{ PAGE : owns
    PRODUCT ||--|| FILE : contains
    PAGE ||--o{ PAGE_CONTENT : displays
    PRODUCT ||--o{ PAGE_CONTENT : referenced_by
    PAGE ||--o{ ORDER : generates
    PAGE ||--o{ REGISTRATION : collects
```

## Core Entities

### User

Represents platform users who create and sell digital products or collect registrations.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| email | String | Email address, used for login |
| name | String | Display name |
| createdAt | Timestamp | Account creation date |
| updatedAt | Timestamp | Last account update |
| stripeAccount | Object | Stripe Connect account details |

### Product

Digital items that users upload and sell through the platform.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| userId | UUID (FK) | Reference to user |
| name | String | Product name |
| description | String | Product details |
| priceInCents | Integer | Price in smallest currency unit |
| currency | String | ISO currency code (e.g., USD) |
| createdAt | Timestamp | Creation date |
| updatedAt | Timestamp | Last update date |
| expiresAt | Timestamp | Automatic expiration date |
| isActive | Boolean | Whether product is available |

### File

Represents the actual digital asset being sold.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| productId | UUID (FK) | Reference to product |
| fileName | String | Original file name |
| fileType | String | MIME type |
| storageKey | String | R2 object key |
| fileSizeBytes | Integer | File size |
| uploadedAt | Timestamp | Upload date |

### Page

A temporary page that can be of various types (sales, countdown, registration, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| shortId | String | Short URL identifier |
| userId | UUID (FK) | Reference to user |
| type | Enum | 'countdown', 'flash-sale', 'event-registration', 'limited-offer', etc. |
| createdAt | Timestamp | Creation date |
| expiresAt | Timestamp | Expiration date/time |
| launchAt | Timestamp | Launch date for pre-launch pages |
| isActive | Boolean | Whether page is currently active |
| customization | JSON | Page style and content customizations |
| settings | JSON | Page-specific settings (e.g., redirect URLs, confirmation messages) |

### Page Content

Content items displayed on a page (can be products, offers, event details, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| pageId | UUID (FK) | Reference to page |
| contentType | String | Type of content ('product', 'event', 'offer', etc.) |
| productId | UUID (FK) | Reference to product (when contentType is 'product', otherwise NULL) |
| title | String | Content title |
| description | String | Content description |
| priceInCents | Integer | Price if applicable (0 for free) |
| currency | String | ISO currency code (if priced) |
| metadata | JSON | Content-specific additional data |

### Order

Records of purchases made through the platform.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| pageId | UUID (FK) | Reference to page |
| productId | UUID (FK) | Reference to product purchased (if applicable) |
| customerId | String | Buyer identifier (may be anonymous) |
| paymentId | String | Stripe payment ID |
| amountPaid | Integer | Amount paid in cents |
| currency | String | ISO currency code |
| createdAt | Timestamp | Purchase date |
| status | Enum | 'completed', 'processing', 'refunded', etc. |
| downloadAttempts | Integer | Number of download attempts |
| lastDownloadAt | Timestamp | Last download timestamp |

### Registration

Signups collected from pre-launch, event registration, or other capture pages.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary identifier |
| pageId | UUID (FK) | Reference to page |
| email | String | Registrant's email |
| name | String | Registrant's name |
| phone | String | Registrant's phone number (optional) |
| registeredAt | Timestamp | Registration date |
| customFields | JSON | Additional collected information |

## Page Types and Their Specific Attributes

### Countdown Landing Page

```json
{
  "type": "countdown",
  "settings": {
    "countdownTarget": "ISO-timestamp",
    "postCountdownAction": "redirect|show-message|show-form",
    "redirectUrl": "https://example.com/destination",
    "messageTitle": "We're live!",
    "messageContent": "The wait is over..."
  }
}
```

### Flash Sale Page

```json
{
  "type": "flash-sale",
  "settings": {
    "saleEndTime": "ISO-timestamp",
    "discountPercentage": 20,
    "originalPriceDisplay": true,
    "inventoryLimit": 100,
    "soldOutAction": "redirect|show-message",
    "postSaleRedirectUrl": "https://example.com/expired"
  }
}
```

### Event Registration Page

```json
{
  "type": "event-registration",
  "settings": {
    "eventStartTime": "ISO-timestamp",
    "eventEndTime": "ISO-timestamp",
    "eventLocation": "virtual|physical",
    "physicalAddress": "123 Main St, City, Country",
    "virtualPlatform": "zoom|meet|teams|custom",
    "platformLink": "https://zoom.us/j/123456",
    "maxAttendees": 500,
    "waitlistEnabled": true
  }
}
```

### Limited-Time Offer Page

```json
{
  "type": "limited-offer",
  "settings": {
    "offerEndTime": "ISO-timestamp",
    "discountCode": "SPECIAL20",
    "bonusDescription": "Free e-book with purchase",
    "limitedQuantity": 50,
    "postOfferAction": "redirect|show-alternate"
  }
}
```

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

### Secondary Indices

- `product.userId`: For listing user's products
- `page.userId`: For listing user's pages
- `page.expiresAt`: For expiration checks
- `registration.pageId`: For campaign performance analysis

## Data Migration and Versioning

- Schema versioning follows semantic versioning
- Migrations are applied through a controlled CI/CD process
- Backward compatibility maintained for at least one previous version