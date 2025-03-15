import { Hono } from 'hono';
import { Env } from '../../types';
import { validateJWT } from '../auth/middleware/authMiddleware';
import { formatResponse } from '../../utils/api-response';
import * as planHandlers from './controllers/planHandlers';
import * as subscriptionHandlers from './controllers/subscriptionHandlers';
import * as stripeHandlers from './controllers/stripeHandlers';
import { createWebhookRouter } from './webhooks/routes';

// Create the subscriptions module router
const subscriptionsModule = new Hono<{ Bindings: Env }>();

// Add webhook routes
// Note: These are not protected by JWT authentication since they need
// to be called by other modules without user context
subscriptionsModule.route('/webhooks', createWebhookRouter());

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

// Stripe Checkout and Portal routes
protectedRoutes.post('/checkout-session', stripeHandlers.createCheckoutSession);
protectedRoutes.post('/portal-session', stripeHandlers.createPortalSession);

// Mount protected routes
subscriptionsModule.route('/', protectedRoutes);

export { subscriptionsModule };