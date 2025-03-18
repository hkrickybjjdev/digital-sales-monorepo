-- Clear all data from tables in reverse order of dependencies (due to foreign key constraints)

-- First clear tables with foreign key relationships
DELETE FROM "TeamMember";
DELETE FROM "Session";
DELETE FROM "PasswordReset";
--DELETE FROM "Price";

-- Clear Pages module tables (in order of dependencies)
DELETE FROM "ContentBlockTranslation";
DELETE FROM "ContentBlock";
DELETE FROM "PageVersionTranslation";
DELETE FROM "PageVersion";
DELETE FROM "Page";
DELETE FROM "ExpirationSetting";

-- Then clear the primary tables
DELETE FROM "Subscription";
DELETE FROM "Team";
DELETE FROM "User";
--DELETE FROM "Plan";
DELETE FROM "AuditLog";