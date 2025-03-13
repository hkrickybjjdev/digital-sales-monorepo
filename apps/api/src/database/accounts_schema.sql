-- Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  isEnterprise INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Group table
CREATE TABLE IF NOT EXISTS "Group" (
  id TEXT PRIMARY KEY,
  organizationId TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
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
  startDate TEXT NOT NULL,
  endDate TEXT,
  status TEXT NOT NULL,
  stripeSubscriptionId TEXT
);

-- Update User table to include organization and group references
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS organizationId TEXT REFERENCES "Organization"(id);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS groupId TEXT REFERENCES "Group"(id);

-- Create indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_organization_name ON "Organization"(name);
CREATE INDEX IF NOT EXISTS idx_group_organizationId ON "Group"(organizationId);
CREATE INDEX IF NOT EXISTS idx_user_organizationId ON "User"(organizationId);
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