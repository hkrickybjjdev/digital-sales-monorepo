-- Session table for auth
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id),
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

-- PasswordReset table
CREATE TABLE IF NOT EXISTS "PasswordReset" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expiresAt INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Team table
CREATE TABLE IF NOT EXISTS "Team" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- TeamMember table
CREATE TABLE IF NOT EXISTS "TeamMember" (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE (teamId, userId)
);

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lockedAt INTEGER,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  failedAttempts INTEGER NOT NULL DEFAULT 0,
  activationToken TEXT,
  activationTokenExpiresAt INTEGER
);

-- Product table
CREATE TABLE IF NOT EXISTS "Product" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  expiresAt INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1
);

-- File table
CREATE TABLE IF NOT EXISTS "File" (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL REFERENCES "Product"(id),
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  storageKey TEXT NOT NULL,
  fileSizeBytes INTEGER NOT NULL,
  uploadedAt INTEGER NOT NULL
);

-- Page table
CREATE TABLE IF NOT EXISTS "Page" (
  id TEXT PRIMARY KEY,
  shortId TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  expiresAt INTEGER,
  launchAt INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  customization TEXT NOT NULL DEFAULT '{}',
  settings TEXT NOT NULL
);

-- Page Content table
CREATE TABLE IF NOT EXISTS "PageContent" (
  id TEXT PRIMARY KEY,
  pageId TEXT NOT NULL REFERENCES "Page"(id) ON DELETE CASCADE,
  contentType TEXT NOT NULL,
  productId TEXT REFERENCES "Product"(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priceInCents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}'
);

-- Order table
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY,
  pageId TEXT NOT NULL REFERENCES "Page"(id),
  productId TEXT REFERENCES "Product"(id),
  customerId TEXT,
  paymentId TEXT NOT NULL,
  amountPaid INTEGER NOT NULL,
  currency TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  status TEXT NOT NULL,
  downloadAttempts INTEGER NOT NULL DEFAULT 0,
  lastDownloadAt INTEGER
);

-- Registration table
CREATE TABLE IF NOT EXISTS "Registration" (
  id TEXT PRIMARY KEY,
  pageId TEXT NOT NULL REFERENCES "Page"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  registeredAt INTEGER NOT NULL,
  customFields TEXT NOT NULL DEFAULT '{}'
);

-- Plan table
CREATE TABLE IF NOT EXISTS "Plan" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  isVisible INTEGER NOT NULL DEFAULT 1,
  features TEXT NOT NULL DEFAULT '{}'
);

-- Price table for recurring billing
CREATE TABLE IF NOT EXISTS "Price" (
  id TEXT PRIMARY KEY,
  planId TEXT REFERENCES "Plan"(id) ON DELETE CASCADE,
  productId TEXT REFERENCES "Product"(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  interval TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  billingScheme TEXT NOT NULL,
  type TEXT NOT NULL,
  CHECK (
    (planId IS NOT NULL AND productId IS NULL) OR
    (planId IS NULL AND productId IS NOT NULL)
  )
);

-- Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  planId TEXT NOT NULL REFERENCES "Plan"(id),
  startDate INTEGER NOT NULL,
  endDate INTEGER,
  status TEXT NOT NULL,
  paymentGateway TEXT,
  subscriptionId TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  cancelAt INTEGER
);

-- Create indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);

CREATE INDEX IF NOT EXISTS idx_session_userId ON "Session"(userId);
CREATE INDEX IF NOT EXISTS idx_session_expiresAt ON "Session"(expiresAt);

CREATE INDEX IF NOT EXISTS idx_password_reset_userId ON "PasswordReset"(userId);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON "PasswordReset"(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiresAt ON "PasswordReset"(expiresAt);

CREATE INDEX IF NOT EXISTS idx_page_userId ON "Page"(userId);
CREATE INDEX IF NOT EXISTS idx_page_shortId ON "Page"(shortId);
CREATE INDEX IF NOT EXISTS idx_page_expiresAt ON "Page"(expiresAt);

CREATE INDEX IF NOT EXISTS idx_page_content_pageId ON "PageContent"(pageId);
CREATE INDEX IF NOT EXISTS idx_page_content_productId ON "PageContent"(productId);

CREATE INDEX IF NOT EXISTS idx_order_pageId ON "Order"(pageId);
CREATE INDEX IF NOT EXISTS idx_order_customerId ON "Order"(customerId);
CREATE INDEX IF NOT EXISTS idx_order_productId ON "Order"(productId);

CREATE INDEX IF NOT EXISTS idx_registration_pageId ON "Registration"(pageId);
CREATE INDEX IF NOT EXISTS idx_registration_email ON "Registration"(email);

CREATE INDEX IF NOT EXISTS idx_product_userId ON "Product"(userId);
CREATE INDEX IF NOT EXISTS idx_file_productId ON "File"(productId);

CREATE INDEX IF NOT EXISTS idx_subscription_teamId ON "Subscription"(teamId);
CREATE INDEX IF NOT EXISTS idx_subscription_planId ON "Subscription"(planId);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status);

CREATE INDEX IF NOT EXISTS idx_team_name ON "Team"(name);
CREATE INDEX IF NOT EXISTS idx_teammember_teamId ON "TeamMember"(teamId);
CREATE INDEX IF NOT EXISTS idx_teammember_userId ON "TeamMember"(userId);
CREATE INDEX IF NOT EXISTS idx_teammember_role ON "TeamMember"(role);

-- Insert default plans
INSERT OR IGNORE INTO "Plan" (id, name, description, isVisible, features) VALUES 
('plan_free', 'Free', 'Basic features for individuals', 1, '{"pageLimit": 3, "fileStorage": 100, "analytics": false}'),
('plan_basic', 'Basic', 'Essential features for small teams', 1, '{"pageLimit": 10, "fileStorage": 1000, "analytics": true}'),
('plan_premium', 'Premium', 'Advanced features for growing businesses', 1, '{"pageLimit": 50, "fileStorage": 10000, "analytics": true, "customDomain": true}'),
('plan_enterprise', 'Enterprise', 'Full feature set for large organizations', 0, '{"pageLimit": -1, "fileStorage": -1, "analytics": true, "customDomain": true, "dedicatedSupport": true}');

-- Insert default prices for plans
INSERT OR IGNORE INTO "Price" (id, planId, currency, interval, createdAt, updatedAt, billingScheme, type) VALUES
-- Free plan
('price_free_monthly', 'plan_free', 'USD', 'month', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),
('price_free_yearly', 'plan_free', 'USD', 'year', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),

-- Basic plan
('price_basic_monthly', 'plan_basic', 'USD', 'month', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),
('price_basic_yearly', 'plan_basic', 'USD', 'year', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),

-- Premium plan
('price_premium_monthly', 'plan_premium', 'USD', 'month', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),
('price_premium_yearly', 'plan_premium', 'USD', 'year', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),

-- Enterprise plan
('price_enterprise_monthly', 'plan_enterprise', 'USD', 'month', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring'),
('price_enterprise_yearly', 'plan_enterprise', 'USD', 'year', strftime('%s','now'), strftime('%s','now'), 'flat_rate', 'recurring');