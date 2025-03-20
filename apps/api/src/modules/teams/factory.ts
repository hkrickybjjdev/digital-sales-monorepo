import { createDatabase } from '@/database/databaseFactory';

import { Env } from './../../types';
import { ITeamRepository, ITeamMemberRepository } from './repositories/interfaces';
import { TeamMemberRepository } from './repositories/teamMemberRepository';
import { TeamRepository } from './repositories/teamRepository';
import { ITeamService, ITeamMemberService } from './services/interfaces';
import { TeamMemberService } from './services/teamMemberService';
import { TeamService } from './services/teamService';
import { TeamsWebhookService, ITeamsWebhookService } from './services/webhookService';

/**
 * Factory functions for creating service instances
 */

/**
 * Create a iTeamRepository instance
 */
export function createITeamRepository(env: Env): ITeamRepository {
  const dbService = createDatabase(env);
  return new TeamRepository(dbService);
}

/**
 * Create a iTeamMemberRepository instance
 */
export function createITeamMemberRepository(env: Env): ITeamMemberRepository {
  const dbService = createDatabase(env);
  return new TeamMemberRepository(dbService);
}

/**
 * Create a teamMemberRepository instance
 */
export function createTeamMemberRepository(env: Env): TeamMemberRepository {
  const dbService = createDatabase(env);
  return new TeamMemberRepository(dbService);
}

/**
 * Create a teamRepository instance
 */
export function createTeamRepository(env: Env): TeamRepository {
  const dbService = createDatabase(env);
  return new TeamRepository(dbService);
}

/**
 * Create a teamService instance
 */
export function createTeamService(env: Env): ITeamService {
  const teamMemberRepository = createTeamMemberRepository(env);
  const teamRepository = createTeamRepository(env);
  const teamsWebhookService = createTeamsWebhookService(env);
  return new TeamService(teamRepository, teamMemberRepository, teamsWebhookService);
}

/**
 * Create a teamMemberService instance
 */
export function createTeamMemberService(env: Env): ITeamMemberService {
  const teamMemberRepository = createTeamMemberRepository(env);
  const teamRepository = createTeamRepository(env);
  return new TeamMemberService(teamRepository, teamMemberRepository);
}

/**
 * Create a teamsWebhookService instance
 */
export function createTeamsWebhookService(env: Env): ITeamsWebhookService {
  return new TeamsWebhookService(env);
}
