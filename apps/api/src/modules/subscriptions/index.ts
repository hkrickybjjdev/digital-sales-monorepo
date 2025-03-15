import { Hono } from 'hono';
import { Env } from '../../types';
import { validateJWT } from '../auth/middleware/authMiddleware';
import { formatResponse } from '../../utils/api-response';
import * as planHandlers from './controllers/planHandlers';
import * as subscriptionHandlers from './controllers/subscriptionHandlers';
import { createWebhookRouter } from './webhooks/routes';

// Create the subscriptions module router
const subscriptionsModule = new Hono<{ Bindings: Env }>();

// Add webhook routes
// Note: These are not protected by JWT authentication since they need
// to be called by other modules without user context
subscriptionsModule.route('/webhooks', createWebhookRouter());

// Documentation route
subscriptionsModule.get('/', (c) => {
  return formatResponse(c, {
    module: 'Subscriptions',
    description: 'Plan and subscription management',
    endpoints: [
      { path: '/plans', method: 'GET', description: 'Get all available plans' },
      { path: '/plans/:planId', method: 'GET', description: 'Get plan details by ID' },
      { path: '/teams/:teamId/subscriptions', method: 'GET', description: 'Get all subscriptions for a team' },
      { path: '/teams/:teamId/subscriptions', method: 'POST', description: 'Create a new subscription for a team' },
      { path: '/subscriptions/:subscriptionId', method: 'GET', description: 'Get subscription details by ID' },
      { path: '/subscriptions/:subscriptionId', method: 'PUT', description: 'Update a subscription' },
      { path: '/subscriptions/:subscriptionId/cancel', method: 'POST', description: 'Cancel a subscription' },
      { path: '/webhooks/teams/team-created', method: 'POST', description: 'Webhook for team creation (no auth)' },
      { path: '/webhooks/teams/team-deleted', method: 'POST', description: 'Webhook for team deletion (no auth)' }
    ]
  });
});

// Public routes - plans are publicly viewable
subscriptionsModule.get('/plans', planHandlers.getPlans);
subscriptionsModule.get('/plans/:planId', planHandlers.getPlanById);

// Protected routes - require JWT authentication
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('/*', validateJWT);

// Team subscription routes
protectedRoutes.get('/teams/:teamId/subscriptions', subscriptionHandlers.getTeamSubscriptions);
protectedRoutes.post('/teams/:teamId/subscriptions', subscriptionHandlers.createSubscription);

// Individual subscription management routes
protectedRoutes.get('/subscriptions/:subscriptionId', subscriptionHandlers.getSubscriptionById);
protectedRoutes.put('/subscriptions/:subscriptionId', subscriptionHandlers.updateSubscription);
protectedRoutes.post('/subscriptions/:subscriptionId/cancel', subscriptionHandlers.cancelSubscription);

// Mount protected routes
subscriptionsModule.route('/', protectedRoutes);

export { subscriptionsModule };