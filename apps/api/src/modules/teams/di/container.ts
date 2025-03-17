import { Env } from '../../../types';
import { ITeamRepository, ITeamMemberRepository } from '../repositories/interfaces';
import { TeamMemberRepository } from '../repositories/teamMemberRepository';
import { TeamRepository } from '../repositories/teamRepository';
import { ITeamService, ITeamMemberService } from '../services/interfaces';
import { TeamMemberService } from '../services/teamMemberService';
import { TeamService } from '../services/teamService';

// Define the shape of our container
interface TeamsContainer {
  // Repositories
  teamRepository: ITeamRepository;
  teamMemberRepository: ITeamMemberRepository;

  // Services
  teamService: ITeamService;
  teamMemberService: ITeamMemberService;
}

// In-memory singleton instances
let teamRepositoryInstance: ITeamRepository | null = null;
let teamMemberRepositoryInstance: ITeamMemberRepository | null = null;
let teamServiceInstance: ITeamService | null = null;
let teamMemberServiceInstance: ITeamMemberService | null = null;
let containerEnv: Env | null = null;

/**
 * Returns a container with all the Teams module dependencies
 * Uses singleton pattern for stateless services
 */
export function getTeamsContainer(env: Env): TeamsContainer {
  // If environment changes, recreate all instances
  if (containerEnv && env !== containerEnv) {
    resetTeamsContainer();
  }

  // Store current environment
  containerEnv = env;

  // Create repository instances if they don't exist
  if (!teamRepositoryInstance) {
    teamRepositoryInstance = new TeamRepository(env.DB);
  }

  if (!teamMemberRepositoryInstance) {
    teamMemberRepositoryInstance = new TeamMemberRepository(env.DB);
  }

  // Create service instances if they don't exist
  // Pass repositories to services
  if (!teamServiceInstance) {
    teamServiceInstance = new TeamService(
      teamRepositoryInstance,
      teamMemberRepositoryInstance,
      env
    );
  }

  if (!teamMemberServiceInstance) {
    teamMemberServiceInstance = new TeamMemberService(
      teamRepositoryInstance,
      teamMemberRepositoryInstance
    );
  }

  return {
    teamRepository: teamRepositoryInstance,
    teamMemberRepository: teamMemberRepositoryInstance,
    teamService: teamServiceInstance,
    teamMemberService: teamMemberServiceInstance,
  };
}

/**
 * Reset all container instances
 * Useful for testing and when environment changes
 */
export function resetTeamsContainer(): void {
  teamRepositoryInstance = null;
  teamMemberRepositoryInstance = null;
  teamServiceInstance = null;
  teamMemberServiceInstance = null;
  containerEnv = null;
}
