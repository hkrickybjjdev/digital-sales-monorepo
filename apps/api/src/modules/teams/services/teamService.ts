import { Env } from '../../../types';
import {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamWithMemberCount,
  TeamMemberWithUser,
} from '../models/schemas';
import { ITeamRepository, ITeamMemberRepository } from '../repositories/interfaces';

import { ITeamService } from './interfaces';
import { TeamsWebhookService } from './webhookService';

export class TeamService implements ITeamService {
  private teamRepository: ITeamRepository;
  private teamMemberRepository: ITeamMemberRepository;
  private maxTeamsPerUser: number;
  private env: Env;
  private webhookService: TeamsWebhookService;

  constructor(
    teamRepository: ITeamRepository,
    teamMemberRepository: ITeamMemberRepository,
    env: Env,
    maxTeamsPerUser: number = 5
  ) {
    this.teamRepository = teamRepository;
    this.teamMemberRepository = teamMemberRepository;
    this.env = env;
    this.maxTeamsPerUser = maxTeamsPerUser;
    this.webhookService = new TeamsWebhookService(env);
  }

  async createTeam(userId: string, data: CreateTeamRequest): Promise<Team> {
    // Check if user has reached the limit of teams they can create
    const teamCount = await this.teamRepository.getTeamCountByUserId(userId);
    if (teamCount >= this.maxTeamsPerUser) {
      throw new Error(
        `You can only create up to ${this.maxTeamsPerUser} teams with your current plan`
      );
    }

    // Create the team
    const team = await this.teamRepository.createTeam({
      name: data.name,
    });

    // Add the creator as the owner
    await this.teamMemberRepository.addTeamMember({
      teamId: team.id,
      userId,
      role: 'owner',
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
      name: data.name,
    });
  }

  async deleteTeam(teamId: string, userId: string): Promise<boolean> {
    // Only owners can delete teams
    const hasPermission = await this.checkTeamPermission(teamId, userId, ['owner']);
    if (!hasPermission) {
      throw new Error('Only team owners can delete teams');
    }

    // Get team details before deletion to use in webhook
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Delete the team from the database
    const success = await this.teamRepository.deleteTeam(teamId);

    if (success) {
      // Emit team deleted event
      try {
        await this.webhookService.triggerTeamDeleted({
          id: teamId,
          name: team.name,
          userId: userId, // User who deleted the team
          createdAt: team.createdAt,
        });
      } catch (error) {
        console.error('Failed to trigger team deleted webhook:', error);
        // Continue with deletion even if webhook fails
      }
    }

    return success;
  }

  async checkTeamPermission(
    teamId: string,
    userId: string,
    requiredRoles: string[]
  ): Promise<boolean> {
    return this.teamRepository.checkUserRole(teamId, userId, requiredRoles);
  }

  async getTeamMembersWithUserInfo(teamId: string, userId: string): Promise<TeamMemberWithUser[]> {
    // Check if user has permission to view team members
    const hasPermission = await this.checkTeamPermission(teamId, userId, [
      'owner',
      'admin',
      'member',
      'viewer',
    ]);
    if (!hasPermission) {
      throw new Error('You do not have permission to view this team');
    }

    return this.teamMemberRepository.getTeamMembersWithUserInfo(teamId);
  }
}
