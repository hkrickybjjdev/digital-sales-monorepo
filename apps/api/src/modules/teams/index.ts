import { Hono } from 'hono';

import { Env } from '../../types';
import { formatResponse } from '../../utils/api-response';
import { validateJWT } from '../auth/middleware/authMiddleware';

import * as teamHandlers from './controllers/teamHandlers';
import * as teamMemberHandlers from './controllers/teamMemberHandlers';
import { createWebhookRouter } from './webhooks/routes';

// Create the teams module router
const teamsModule = new Hono<{ Bindings: Env }>();

// Use JWT authentication for all routes EXCEPT webhooks
// We'll add webhook routes before applying the JWT middleware
// to keep them accessible without authentication

// Add webhook routes
// Note: These are not protected by JWT authentication since they need
// to be called by other modules without user context
teamsModule.route('/webhooks', createWebhookRouter());

// Use JWT authentication for all routes EXCEPT webhooks
// We apply this middleware AFTER adding webhook routes
teamsModule.use('*', validateJWT);

// Team routes
teamsModule.get('/', teamHandlers.getUserTeams);
teamsModule.post('/', teamHandlers.createTeam);
teamsModule.get('/:teamId', teamHandlers.getTeam);
teamsModule.put('/:teamId', teamHandlers.updateTeam);
teamsModule.delete('/:teamId', teamHandlers.deleteTeam);

// Team member routes
teamsModule.get('/:teamId/members', teamHandlers.getTeamMembers);
teamsModule.post('/:teamId/members', teamMemberHandlers.addTeamMember);
teamsModule.put('/:teamId/members/:memberId', teamMemberHandlers.updateTeamMember);
teamsModule.delete('/:teamId/members/:memberId', teamMemberHandlers.removeTeamMember);

export { teamsModule };
