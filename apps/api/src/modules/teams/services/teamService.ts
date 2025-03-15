import { 
  Team, 
  CreateTeamRequest, 
  UpdateTeamRequest, 
  TeamWithMemberCount,
  TeamMemberWithUser
} from '../models/schemas';
import { ITeamService } from './interfaces';
import { ITeamRepository, ITeamMemberRepository } from '../repositories/interfaces';

export class TeamService implements ITeamService {
  private teamRepository: ITeamRepository;
  private teamMemberRepository: ITeamMemberRepository;
  private maxTeamsPerUser: number;

  constructor(
    teamRepository: ITeamRepository, 
    teamMemberRepository: ITeamMemberRepository,
    maxTeamsPerUser: number = 5
  ) {
    this.teamRepository = teamRepository;
    this.teamMemberRepository = teamMemberRepository;
    this.maxTeamsPerUser = maxTeamsPerUser;
  }

  async createTeam(userId: string, data: CreateTeamRequest): Promise<Team> {
    // Check if user has reached the limit of teams they can create
    const teamCount = await this.teamRepository.getTeamCountByUserId(userId);
    if (teamCount >= this.maxTeamsPerUser) {
      throw new Error(`You can only create up to ${this.maxTeamsPerUser} teams with your current plan`);
    }

    // Create the team
    const team = await this.teamRepository.createTeam({
      name: data.name      
    });

    // Add the creator as the owner
    await this.teamMemberRepository.addTeamMember({
      teamId: team.id,
      userId,
      role: 'owner'
    });

    return team;
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    return this.teamRepository.getTeamById(teamId);
  }

  async getUserTeams(userId: string): Promise<TeamWithMemberCount[]> {
    return this.teamRepository.getTeamsByUserId(userId);
  }

  async updateTeam(teamId: string, userId: string, data: UpdateTeamRequest): Promise<Team | null> {
    // Check if user has permission to update the team
    const hasPermission = await this.checkTeamPermission(teamId, userId, ['owner', 'admin']);
    if (!hasPermission) {
      throw new Error('You do not have permission to update this team');
    }

    return this.teamRepository.updateTeam(teamId, {
      name: data.name
    });
  }

  async deleteTeam(teamId: string, userId: string): Promise<boolean> {
    // Only owners can delete teams
    const hasPermission = await this.checkTeamPermission(teamId, userId, ['owner']);
    if (!hasPermission) {
      throw new Error('Only team owners can delete teams');
    }

    return this.teamRepository.deleteTeam(teamId);
  }

  async checkTeamPermission(teamId: string, userId: string, requiredRoles: string[]): Promise<boolean> {
    return this.teamRepository.checkUserRole(teamId, userId, requiredRoles);
  }

  async getTeamMembersWithUserInfo(teamId: string, userId: string): Promise<TeamMemberWithUser[]> {
    // Check if user has permission to view team members
    const hasPermission = await this.checkTeamPermission(teamId, userId, ['owner', 'admin', 'member', 'viewer']);
    if (!hasPermission) {
      throw new Error('You do not have permission to view this team');
    }

    return this.teamMemberRepository.getTeamMembersWithUserInfo(teamId);
  }
}