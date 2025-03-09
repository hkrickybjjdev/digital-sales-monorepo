# Temporary Pages Platform API

This is the backend API for the Temporary Pages Platform, built as a modular monolith using Cloudflare Workers.

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
  │   ├── controllers/ # Request handlers
  │   ├── services/    # Business logic
  │   ├── models/      # Data models
  │   ├── utils/       # Module-specific utilities
  │   └── index.ts     # Public API of the module
  ├── pages/           # Page management
  ├── products/        # Digital product handling
  ├── payments/        # Stripe integration
  ├── storage/         # File upload and delivery
  └── analytics/       # Usage tracking and reporting
```

## Environment Variables

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