-- Clear all data from tables in reverse order of dependencies (due to foreign key constraints)

-- First clear tables with foreign key relationships
DELETE FROM "TeamMember";
DELETE FROM "Session";
DELETE FROM "PasswordReset";
--DELETE FROM "Price";

-- Then clear the primary tables
DELETE FROM "Subscription";
DELETE FROM "Team";
DELETE FROM "User";
--DELETE FROM "Plan";
DELETE FROM "AuditLog";