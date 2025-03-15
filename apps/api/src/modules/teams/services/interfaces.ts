import { 
  Team, 
  TeamMember, 
  CreateTeamRequest, 
  UpdateTeamRequest, 
  AddTeamMemberRequest, 
  UpdateTeamMemberRequest,
  TeamWithMemberCount,
  TeamMemberWithUser
} from '../models/schemas';

/**
 * Interface for the team service
 */
export interface ITeamService {
  /**
   * Create a new team
   */
  createTeam(userId: string, data: CreateTeamRequest): Promise<Team>;

  /**
   * Get a team by ID
   */
  getTeamById(teamId: string): Promise<Team | null>;

  /**
   * Get teams that a user belongs to
   */
  getUserTeams(userId: string): Promise<TeamWithMemberCount[]>;

  /**
   * Update a team
   */
  updateTeam(teamId: string, userId: string, data: UpdateTeamRequest): Promise<Team | null>;

  /**
   * Delete a team
   */
  deleteTeam(teamId: string, userId: string): Promise<boolean>;

  /**
   * Check if a user has a specific permission in a team
   */
  checkTeamPermission(teamId: string, userId: string, requiredRoles: string[]): Promise<boolean>;

  /**
   * Get team members with user information
   */
  getTeamMembersWithUserInfo(teamId: string, userId: string): Promise<TeamMemberWithUser[]>;
}

/**
 * Interface for the team member service
 */
export interface ITeamMemberService {
  /**
   * Add a member to a team
   */
  addTeamMember(teamId: string, currentUserId: string, data: AddTeamMemberRequest): Promise<TeamMember>;

  /**
   * Update a team member
   */
  updateTeamMember(
    teamId: string, 
    memberId: string, 
    currentUserId: string, 
    data: UpdateTeamMemberRequest
  ): Promise<TeamMember | null>;

  /**
   * Remove a member from a team
   */
  removeTeamMember(teamId: string, memberId: string, currentUserId: string): Promise<boolean>;
}