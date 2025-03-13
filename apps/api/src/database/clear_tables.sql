-- Clear all data from tables in reverse order of dependencies (due to foreign key constraints)

-- First clear tables with foreign key relationships
DELETE FROM "File";
DELETE FROM "Registration";
DELETE FROM "Order";
DELETE FROM "PageContent";
DELETE FROM "Session";

-- Then clear the primary tables
DELETE FROM "Subscription";
DELETE FROM "UserRole";
DELETE FROM "Group";
DELETE FROM "Organization";
DELETE FROM "Page";
DELETE FROM "Product";
DELETE FROM "User";
DELETE FROM "Role";
DELETE FROM "Plan";