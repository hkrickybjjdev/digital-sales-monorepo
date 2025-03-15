import { Env } from '../../../types';
import { ITeamRepository, ITeamMemberRepository } from '../repositories/interfaces';
import { TeamRepository } from '../repositories/teamRepository';
import { TeamMemberRepository } from '../repositories/teamMemberRepository';
import { ITeamService, ITeamMemberService } from '../services/interfaces';
import { TeamService } from '../services/teamService';
import { TeamMemberService } from '../services/teamMemberService';

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

/**
 * Returns a container with all the Teams module dependencies
 * Uses singleton pattern for stateless services
 */
export function getTeamsContainer(env: Env): TeamsContainer {
  // Create repository instances if they don't exist or environment changed
  if (!teamRepositoryInstance) {
    teamRepositoryInstance = new TeamRepository(env.DB);
  }
  
  if (!teamMemberRepositoryInstance) {
    teamMemberRepositoryInstance = new TeamMemberRepository(env.DB);
  }
  
  // Create service instances if they don't exist or environment changed
  // Pass repositories to services
  if (!teamServiceInstance) {
    teamServiceInstance = new TeamService(
      teamRepositoryInstance, 
      teamMemberRepositoryInstance
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
    teamMemberService: teamMemberServiceInstance
  };
}