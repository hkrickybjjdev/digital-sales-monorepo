import { Hono } from 'hono';

import { Env } from '../../../types';

import { handleStripeWebhook } from './stripeWebhookHandlers';
import { handleTeamCreated, handleTeamDeleted } from './teamWebhookHandlers';

/**
 * Create webhook router
 *
 * This router defines all webhook endpoints for the subscriptions module.
 * These endpoints are meant to be called by other modules to integrate with subscriptions.
 */
export function createWebhookRouter(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  // Teams module webhooks
  router.post('/teams/team-created', handleTeamCreated);
  router.post('/teams/team-deleted', handleTeamDeleted);

  // Stripe webhooks
  router.post('/stripe', async c => {
    // Stripe webhooks need raw body for signature verification
    // Hono parses the body by default, so we need to handle it specially
    return handleStripeWebhook(c);
  });

  // Documentation endpoint
  router.get('/', c => {
    return c.json({
      module: 'Subscriptions',
      webhooks: [
        {
          path: '/teams/team-created',
          method: 'POST',
          description: 'Handle team creation events from teams module',
        },
        {
          path: '/teams/team-deleted',
          method: 'POST',
          description: 'Handle team deletion events from teams module',
        },
        { path: '/stripe', method: 'POST', description: 'Handle Stripe webhook events' },
      ],
    });
  });

  return router;
}
