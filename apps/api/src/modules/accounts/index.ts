import { Hono } from 'hono';
import { Env } from '../../types';
import { validateJWT } from '../auth/middleware/authMiddleware';
import * as organizationHandlers from './controllers/organizationHandlers';
import * as groupHandlers from './controllers/groupHandlers';
import * as roleHandlers from './controllers/roleHandlers';
import * as subscriptionHandlers from './controllers/subscriptionHandlers';
import * as integrationHandlers from './controllers/integrationHandlers';
import { 
  requireAdminPermission, 
  requireUserManagementPermission, 
  requireSubscriptionManagementPermission,
  requireOrganizationMembership
} from './middleware/permissionsMiddleware';

// Create a Hono app for the accounts module
const accountsModule = new Hono<{ Bindings: Env }>();
accountsModule.use('/*', validateJWT);

// Integration endpoints for auth and other modules
accountsModule.post('/integrations/user-registration', integrationHandlers.handleUserRegistration);
accountsModule.post('/integrations/user-update', integrationHandlers.handleUserUpdate);
accountsModule.post('/integrations/user-deletion', integrationHandlers.handleUserDeletion);

// Organization routes - require admin permissions for management
accountsModule.post('/organizations', requireAdminPermission, organizationHandlers.createOrganization);
accountsModule.get('/organizations', requireAdminPermission, organizationHandlers.listOrganizations);
accountsModule.get('/organizations/:id', requireOrganizationMembership, organizationHandlers.getOrganization);
accountsModule.get('/organizations/:id/groups', requireOrganizationMembership, organizationHandlers.getOrganizationWithGroups);
accountsModule.put('/organizations/:id', requireAdminPermission, organizationHandlers.updateOrganization);
accountsModule.delete('/organizations/:id', requireAdminPermission, organizationHandlers.deleteOrganization);

// Group routes - require user management permissions
accountsModule.post('/groups', requireUserManagementPermission, groupHandlers.createGroup);
accountsModule.get('/groups/:id', requireOrganizationMembership, groupHandlers.getGroup);
accountsModule.put('/groups/:id', requireUserManagementPermission, groupHandlers.updateGroup);
accountsModule.delete('/groups/:id', requireUserManagementPermission, groupHandlers.deleteGroup);
accountsModule.get('/organizations/:organizationId/groups', requireOrganizationMembership, groupHandlers.listGroupsByOrganization);
accountsModule.get('/groups/:id/users', requireOrganizationMembership, groupHandlers.getUsersInGroup);
accountsModule.post('/groups/:id/users', requireUserManagementPermission, groupHandlers.assignUserToGroup);
accountsModule.delete('/groups/:id/users/:userId', requireUserManagementPermission, groupHandlers.removeUserFromGroup);

// Role routes - require admin permissions for role management
accountsModule.get('/roles', roleHandlers.listRoles);
accountsModule.get('/roles/:id', roleHandlers.getRoleById);
accountsModule.get('/users/:userId/roles', roleHandlers.getUserRoles);
accountsModule.post('/roles/assign', requireUserManagementPermission, roleHandlers.assignRoleToUser);
accountsModule.delete('/users/:userId/roles/:roleId', requireUserManagementPermission, roleHandlers.removeRoleFromUser);
accountsModule.get('/users/:userId/permissions', roleHandlers.getUserPermissions);
accountsModule.get('/roles/:roleId/users', requireUserManagementPermission, roleHandlers.getUsersByRole);

// Subscription and Plan routes - require subscription management permissions for admin operations
accountsModule.get('/subscriptions/:id', requireSubscriptionManagementPermission, subscriptionHandlers.getSubscription);
accountsModule.get('/users/:userId/subscription', subscriptionHandlers.getUserSubscription);
accountsModule.post('/subscriptions', requireSubscriptionManagementPermission, subscriptionHandlers.createSubscription);
accountsModule.put('/subscriptions/:id', requireSubscriptionManagementPermission, subscriptionHandlers.updateSubscription);
accountsModule.delete('/subscriptions/:id', requireSubscriptionManagementPermission, subscriptionHandlers.cancelSubscription);
accountsModule.post('/users/:userId/subscription/upgrade', subscriptionHandlers.upgradeSubscription);
accountsModule.get('/users/:userId/subscriptions', subscriptionHandlers.listUserSubscriptions);
accountsModule.get('/plans', subscriptionHandlers.listAvailablePlans);
accountsModule.post('/users/:userId/free-plan', requireSubscriptionManagementPermission, subscriptionHandlers.assignFreePlan);

export { accountsModule };