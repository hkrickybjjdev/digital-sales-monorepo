import { Hono } from 'hono';
import { Env } from '../../../types';
import { 
  handleUserCreated, 
  handleUserUpdated, 
  handleUserDeleted 
} from './authWebhookHandlers';

/**
 * Create webhook router
 * 
 * This router defines all webhook endpoints for the teams module.
 * These endpoints are meant to be called by other modules to integrate with teams.
 */
export function createWebhookRouter(): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  
  // Auth module webhooks
  router.post('/auth/user-created', handleUserCreated);
  router.post('/auth/user-updated', handleUserUpdated);
  router.post('/auth/user-deleted', handleUserDeleted);
  
  // Documentation endpoint
  router.get('/', (c) => {
    return c.json({
      module: 'Teams',
      webhooks: [
        { path: '/auth/user-created', method: 'POST', description: 'Handle user creation events from auth module' },
        { path: '/auth/user-updated', method: 'POST', description: 'Handle user update events from auth module' },
        { path: '/auth/user-deleted', method: 'POST', description: 'Handle user deletion events from auth module' }
      ]
    });
  });
  
  return router;
} 