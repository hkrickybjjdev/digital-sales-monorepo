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

/**
 * Class-based dependency injection container for the teams module
 * Creates and manages singleton instances of services
 */
export class Container {
  private static instance: Container;
  private services: Partial<TeamsContainer> = {};
  private env: Env | null = null;

  private constructor() {}

  /**
   * Gets the singleton container instance
   * @returns The container instance
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Initializes the container with environment variables
   * @param env Cloudflare Workers environment
   */
  public initialize(env: Env): void {
    // If environment changes, reset the container
    if (this.env && this.env !== env) {
      this.clear();
    }

    // Store current environment
    this.env = env;

    // Only initialize services if they haven't been created yet
    if (Object.keys(this.services).length === 0) {
      // Create repository instances
      const teamRepository = new TeamRepository(env);
      const teamMemberRepository = new TeamMemberRepository(env);

      // Create service instances
      const teamService = new TeamService(teamRepository, teamMemberRepository, env);

      const teamMemberService = new TeamMemberService(teamRepository, teamMemberRepository);

      // Register all services
      this.services.teamRepository = teamRepository;
      this.services.teamMemberRepository = teamMemberRepository;
      this.services.teamService = teamService;
      this.services.teamMemberService = teamMemberService;
    }
  }

  /**
   * Gets a service instance by name
   * @param serviceName The name of the service to retrieve
   * @returns The service instance
   */
  public get<K extends keyof TeamsContainer>(serviceName: K): TeamsContainer[K] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found or not initialized`);
    }
    return service as TeamsContainer[K];
  }

  /**
   * For testing: clear all services and reset the container
   */
  public clear(): void {
    this.services = {};
    this.env = null;
  }
}

/**
 * Factory function to get the teams container
 * @param env Cloudflare Workers environment
 * @returns The initialized teams container
 */
function getContainer(env: Env): Container {
  const container = Container.getInstance();
  container.initialize(env);
  return container;
}

/**
 * Helper function to get a service from the container
 * @param env Cloudflare Workers environment
 * @param serviceName The name of the service to retrieve
 * @returns The service instance
 */
export function getService<K extends keyof TeamsContainer>(
  env: Env,
  serviceName: K
): TeamsContainer[K] {
  return getContainer(env).get(serviceName);
}
