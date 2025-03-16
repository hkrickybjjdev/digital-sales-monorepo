-- Clear all data from tables in reverse order of dependencies (due to foreign key constraints)

-- First clear tables with foreign key relationships
DELETE FROM "TeamMember";
DELETE FROM "File";
DELETE FROM "Registration";
DELETE FROM "Order";
DELETE FROM "PageContent";
DELETE FROM "Session";
DELETE FROM "PasswordReset";
--DELETE FROM "Price";

-- Then clear the primary tables
DELETE FROM "Subscription";
DELETE FROM "Page";
DELETE FROM "Product";
DELETE FROM "Team";
DELETE FROM "User";
--DELETE FROM "Plan";