-- Session table for auth
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id),
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,  
  groupId TEXT REFERENCES "Group"(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  stripeAccount TEXT,
  lockedAt INTEGER
);

-- Product table
CREATE TABLE IF NOT EXISTS "Product" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  priceInCents INTEGER NOT NULL,
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

-- Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  isEnterprise INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Group table
CREATE TABLE IF NOT EXISTS "Group" (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Role table
CREATE TABLE IF NOT EXISTS "Role" (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- User Role mapping table
CREATE TABLE IF NOT EXISTS "UserRole" (
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  roleId TEXT NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
  PRIMARY KEY (userId, roleId)
);

-- Plan table
CREATE TABLE IF NOT EXISTS "Plan" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  priceInCents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  interval TEXT NOT NULL,
  isVisible INTEGER NOT NULL DEFAULT 1,
  features TEXT NOT NULL DEFAULT '{}'
);

-- Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  planId TEXT NOT NULL REFERENCES "Plan"(id),
  startDate INTEGER NOT NULL,
  endDate INTEGER,
  status TEXT NOT NULL,
  stripeSubscriptionId TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  cancelAt INTEGER
);

-- Create indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);

CREATE INDEX IF NOT EXISTS idx_session_userId ON "Session"(userId);
CREATE INDEX IF NOT EXISTS idx_session_expiresAt ON "Session"(expiresAt);

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

CREATE INDEX IF NOT EXISTS idx_organization_name ON "Organization"(name);
CREATE INDEX IF NOT EXISTS idx_group_organizationId ON "Group"(organizationId);
CREATE INDEX IF NOT EXISTS idx_user_groupId ON "User"(groupId);
CREATE INDEX IF NOT EXISTS idx_userrole_userId ON "UserRole"(userId);
CREATE INDEX IF NOT EXISTS idx_userrole_roleId ON "UserRole"(roleId);
CREATE INDEX IF NOT EXISTS idx_subscription_userId ON "Subscription"(userId);
CREATE INDEX IF NOT EXISTS idx_subscription_planId ON "Subscription"(planId);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status);

-- Insert default roles
INSERT OR IGNORE INTO "Role" (id, name) VALUES 
('role_admin', 'admin'),
('role_manager', 'manager'),
('role_editor', 'editor'),
('role_viewer', 'viewer');

-- Insert default plans
INSERT OR IGNORE INTO "Plan" (id, name, description, priceInCents, currency, interval, isVisible, features) VALUES 
('plan_free', 'Free', 'Basic features for individuals', 0, 'USD', 'month', 1, '{"pageLimit": 3, "fileStorage": 100, "analytics": false}'),
('plan_basic', 'Basic', 'Essential features for small teams', 1999, 'USD', 'month', 1, '{"pageLimit": 10, "fileStorage": 1000, "analytics": true}'),
('plan_premium', 'Premium', 'Advanced features for growing businesses', 4999, 'USD', 'month', 1, '{"pageLimit": 50, "fileStorage": 10000, "analytics": true, "customDomain": true}'),
('plan_enterprise', 'Enterprise', 'Full feature set for large organizations', 9999, 'USD', 'month', 0, '{"pageLimit": -1, "fileStorage": -1, "analytics": true, "customDomain": true, "dedicatedSupport": true}');