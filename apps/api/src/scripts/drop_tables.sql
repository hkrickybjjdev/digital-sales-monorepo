-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "TeamMember";
DROP TABLE IF EXISTS "PasswordReset";
DROP TABLE IF EXISTS "Price";

-- Drop Pages module tables (in correct order for foreign key constraints)
DROP TABLE IF EXISTS "ContentBlockTranslation";
DROP TABLE IF EXISTS "ContentBlock";
DROP TABLE IF EXISTS "PageVersionTranslation";
DROP TABLE IF EXISTS "PageVersion";
DROP TABLE IF EXISTS "Page";
DROP TABLE IF EXISTS "ExpirationSetting";

DROP TABLE IF EXISTS "Team";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "Plan";
DROP TABLE IF EXISTS "AuditLog";
