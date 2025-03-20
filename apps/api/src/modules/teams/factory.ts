import { Env } from './../../types';
import { ITeamRepository, ITeamMemberRepository } from './repositories/interfaces';
import { TeamMemberRepository } from './repositories/teamMemberRepository';
import { TeamRepository } from './repositories/teamRepository';
import { ITeamService, ITeamMemberService } from './services/interfaces';
import { TeamMemberService } from './services/teamMemberService';
import { TeamService } from './services/teamService';

/**
 * Factory functions for creating service instances
 */

/**
 * Create a iTeamRepository instance
 */
export function createITeamRepository(env: Env): ITeamRepository {
  return new TeamRepository(env);
}

/**
 * Create a iTeamMemberRepository instance
 */
export function createITeamMemberRepository(env: Env): ITeamMemberRepository {
  return new TeamMemberRepository(env);
}

/**
 * Create a teamMemberRepository instance
 */
export function createTeamMemberRepository(env: Env): TeamMemberRepository {
  return new TeamMemberRepository(env);
}

/**
 * Create a teamRepository instance
 */
export function createTeamRepository(env: Env): TeamRepository {
  return new TeamRepository(env);
}

/**
 * Create a teamService instance
 */
export function createTeamService(env: Env): ITeamService {
  const teamMemberRepository = createTeamMemberRepository(env);
  const teamRepository = createTeamRepository(env);
  return new TeamService(teamRepository, teamMemberRepository, env);
}

/**
 * Create a teamMemberService instance
 */
export function createTeamMemberService(env: Env): ITeamMemberService {
  const teamMemberRepository = createTeamMemberRepository(env);
  const teamRepository = createTeamRepository(env);
  return new TeamMemberService(teamRepository, teamMemberRepository);
}