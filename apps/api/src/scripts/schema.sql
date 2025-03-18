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
  activationTokenExpiresAt INTEGER,
  timezone TEXT
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
  currency TEXT NOT NULL,
  interval TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  billingScheme TEXT NOT NULL,
  type TEXT NOT NULL
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

-- AuditLog table for tracking database operations with enhanced fields
CREATE TABLE IF NOT EXISTS "AuditLog" (
  logId INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  eventType TEXT NOT NULL,
  resourceType TEXT,
  resourceId TEXT,
  timestamp INTEGER NOT NULL,
  details TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  sessionId TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  outcome TEXT NOT NULL
);

-- Create indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);

CREATE INDEX IF NOT EXISTS idx_session_userId ON "Session"(userId);
CREATE INDEX IF NOT EXISTS idx_session_expiresAt ON "Session"(expiresAt);

CREATE INDEX IF NOT EXISTS idx_password_reset_userId ON "PasswordReset"(userId);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON "PasswordReset"(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiresAt ON "PasswordReset"(expiresAt);

-- The following indexes refer to tables that will be created later

CREATE INDEX IF NOT EXISTS idx_subscription_teamId ON "Subscription"(teamId);
CREATE INDEX IF NOT EXISTS idx_subscription_planId ON "Subscription"(planId);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status);

CREATE INDEX IF NOT EXISTS idx_team_name ON "Team"(name);
CREATE INDEX IF NOT EXISTS idx_teammember_teamId ON "TeamMember"(teamId);
CREATE INDEX IF NOT EXISTS idx_teammember_userId ON "TeamMember"(userId);
CREATE INDEX IF NOT EXISTS idx_teammember_role ON "TeamMember"(role);

CREATE INDEX IF NOT EXISTS idx_audit_user ON "AuditLog"(userId);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON "AuditLog"(resourceType, resourceId);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON "AuditLog"(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON "AuditLog"(eventType);
CREATE INDEX IF NOT EXISTS idx_audit_outcome ON "AuditLog"(outcome);

-- Create Page table
CREATE TABLE IF NOT EXISTS "Page" (
    id TEXT PRIMARY KEY,
    teamId INTEGER NOT NULL, -- Foreign Key to the User table
    slug TEXT UNIQUE,
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'expired', 'archived'
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    updatedAt INTEGER, -- Unix timestamp (seconds since epoch)
    FOREIGN KEY (teamId) REFERENCES "Team"(id)
);

-- Create ExpirationSetting table
CREATE TABLE IF NOT EXISTS "ExpirationSetting" (
    id TEXT PRIMARY KEY,
    expirationType TEXT NOT NULL, -- e.g., 'datetime', 'duration'
    expiresAtDatetime INTEGER, -- Unix timestamp (seconds since epoch)
    durationSeconds INTEGER,
    expirationAction TEXT NOT NULL, -- e.g., 'unpublish', 'redirect'
    redirectUrl TEXT,
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    updatedAt INTEGER -- Unix timestamp (seconds since epoch)
);

-- Create PageVersion table
CREATE TABLE IF NOT EXISTS "PageVersion" (
    id TEXT PRIMARY KEY,
    pageId TEXT NOT NULL, -- Foreign Key to the Page table
    versionNumber INTEGER NOT NULL,
    isPublished BOOLEAN DEFAULT FALSE,
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    publishedAt INTEGER, -- Unix timestamp (seconds since epoch)
    publishFrom INTEGER, -- Unix timestamp (seconds since epoch)
    expirationId TEXT, -- Foreign Key to the ExpirationSetting table
    FOREIGN KEY (pageId) REFERENCES "Page"(id) ON DELETE CASCADE,
    FOREIGN KEY (expirationId) REFERENCES "ExpirationSetting"(id)
);

-- Create PageVersionTranslation table
CREATE TABLE IF NOT EXISTS "PageVersionTranslation" (
    id TEXT PRIMARY KEY,
    versionId TEXT NOT NULL, -- Foreign Key to the PageVersion table
    languageCode VARCHAR(10) NOT NULL,
    socialShareTitle TEXT,
    socialShareDescription TEXT,
    metaDescription TEXT,
    metaKeywords TEXT,
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    updatedAt INTEGER, -- Unix timestamp (seconds since epoch)
    FOREIGN KEY (versionId) REFERENCES "PageVersion"(id) ON DELETE CASCADE,
    UNIQUE (versionId, languageCode)
);

-- Create ContentBlock table
CREATE TABLE IF NOT EXISTS "ContentBlock" (
    id TEXT PRIMARY KEY,
    versionId TEXT NOT NULL, -- Foreign Key to the PageVersion table
    blockType TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    content TEXT,
    settings TEXT, -- Store JSON data as TEXT
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    updatedAt INTEGER, -- Unix timestamp (seconds since epoch)
    displayState TEXT DEFAULT 'live', -- 'live' or 'expired'
    FOREIGN KEY (versionId) REFERENCES "PageVersion"(id) ON DELETE CASCADE
);

-- Create ContentBlockTranslation table
CREATE TABLE IF NOT EXISTS "ContentBlockTranslation" (
    id TEXT PRIMARY KEY,
    contentBlockId TEXT NOT NULL, -- Foreign Key to the ContentBlock table
    languageCode VARCHAR(10) NOT NULL,
    content TEXT,
    settings TEXT, -- Store JSON data as TEXT
    createdAt INTEGER, -- Unix timestamp (seconds since epoch)
    updatedAt INTEGER, -- Unix timestamp (seconds since epoch)
    FOREIGN KEY (contentBlockId) REFERENCES "ContentBlock"(id) ON DELETE CASCADE,
    UNIQUE (contentBlockId, languageCode)
);

-- Create indexes for Pages module tables
CREATE INDEX IF NOT EXISTS idx_page_slug ON "Page"(slug);
CREATE INDEX IF NOT EXISTS idx_page_team ON "Page"(teamId);
CREATE INDEX IF NOT EXISTS idx_page_status ON "Page"(status);
CREATE INDEX IF NOT EXISTS idx_pageversion_page ON "PageVersion"(pageId);
CREATE INDEX IF NOT EXISTS idx_pageversion_published ON "PageVersion"(isPublished);
CREATE INDEX IF NOT EXISTS idx_pageversion_expiration ON "PageVersion"(expirationId);
CREATE INDEX IF NOT EXISTS idx_pageversion_version ON "PageVersion"(pageId, versionNumber);
CREATE INDEX IF NOT EXISTS idx_pageversiontrans_version ON "PageVersionTranslation"(versionId);
CREATE INDEX IF NOT EXISTS idx_pageversiontrans_language ON "PageVersionTranslation"(versionId, languageCode);
CREATE INDEX IF NOT EXISTS idx_contentblock_version ON "ContentBlock"(versionId);
CREATE INDEX IF NOT EXISTS idx_contentblock_order ON "ContentBlock"(versionId, "order");
CREATE INDEX IF NOT EXISTS idx_contentblock_displaystate ON "ContentBlock"(displayState);
CREATE INDEX IF NOT EXISTS idx_contentblocktrans_block ON "ContentBlockTranslation"(contentBlockId);
CREATE INDEX IF NOT EXISTS idx_contentblocktrans_language ON "ContentBlockTranslation"(contentBlockId, languageCode);

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