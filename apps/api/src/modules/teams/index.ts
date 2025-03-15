import { Hono } from 'hono';
import { Env } from '../../types';
import * as teamHandlers from './controllers/teamHandlers';
import * as teamMemberHandlers from './controllers/teamMemberHandlers';
import { validateJWT } from '../auth/middleware/authMiddleware';
import { formatResponse } from '../../utils/api-response';

// Create the teams module router
const teamsModule = new Hono<{ Bindings: Env }>();

// Use JWT authentication for all routes
teamsModule.use('*', validateJWT);

// Documentation route
teamsModule.get('/', (c) => {
  return formatResponse(c, {
    module: 'Teams',
    endpoints: [
      { path: '/', method: 'GET', description: 'Get teams that the current user belongs to' },
      { path: '/', method: 'POST', description: 'Create a new team' },
      { path: '/:teamId', method: 'GET', description: 'Get team details' },
      { path: '/:teamId', method: 'PUT', description: 'Update team details' },
      { path: '/:teamId', method: 'DELETE', description: 'Delete a team' },
      { path: '/:teamId/members', method: 'GET', description: 'Get team members' },
      { path: '/:teamId/members', method: 'POST', description: 'Add a member to the team' },
      { path: '/:teamId/members/:memberId', method: 'PUT', description: 'Update a team member\'s role' },
      { path: '/:teamId/members/:memberId', method: 'DELETE', description: 'Remove a member from the team' }
    ]
  });
});

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