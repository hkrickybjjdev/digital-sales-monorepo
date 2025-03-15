import { Hono } from 'hono';
import { Env } from '../../../types';
import { 
  handleTeamCreated,
  handleTeamDeleted
} from './teamWebhookHandlers';

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
  
  // Documentation endpoint
  router.get('/', (c) => {
    return c.json({
      module: 'Subscriptions',
      webhooks: [
        { path: '/teams/team-created', method: 'POST', description: 'Handle team creation events from teams module' },
        { path: '/teams/team-deleted', method: 'POST', description: 'Handle team deletion events from teams module' }
      ]
    });
  });
  
  return router;
} 