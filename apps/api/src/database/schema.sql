-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  stripeAccount TEXT
);

-- Product table
CREATE TABLE IF NOT EXISTS "Product" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  priceInCents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  expiresAt TEXT,
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
  uploadedAt TEXT NOT NULL
);

-- Page table
CREATE TABLE IF NOT EXISTS "Page" (
  id TEXT PRIMARY KEY,
  shortId TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES "User"(id),
  type TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  expiresAt TEXT,
  launchAt TEXT,
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
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL,
  downloadAttempts INTEGER NOT NULL DEFAULT 0,
  lastDownloadAt TEXT
);

-- Registration table
CREATE TABLE IF NOT EXISTS "Registration" (
  id TEXT PRIMARY KEY,
  pageId TEXT NOT NULL REFERENCES "Page"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  registeredAt TEXT NOT NULL,
  customFields TEXT NOT NULL DEFAULT '{}'
);

-- Create indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_page_userId ON "Page"(userId);
CREATE INDEX IF NOT EXISTS idx_page_shortId ON "Page"(shortId);
CREATE INDEX IF NOT EXISTS idx_page_expiresAt ON "Page"(expiresAt);

CREATE INDEX IF NOT EXISTS idx_page_content_pageId ON "PageContent"(pageId);

CREATE INDEX IF NOT EXISTS idx_order_pageId ON "Order"(pageId);
CREATE INDEX IF NOT EXISTS idx_order_customerId ON "Order"(customerId);

CREATE INDEX IF NOT EXISTS idx_registration_pageId ON "Registration"(pageId);
CREATE INDEX IF NOT EXISTS idx_registration_email ON "Registration"(email);