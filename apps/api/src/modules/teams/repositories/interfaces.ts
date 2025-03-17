import { Team, TeamMember, TeamWithMemberCount } from '../models/schemas';

/**
 * Interface for the team repository
 */
export interface ITeamRepository {
  /**
   * Create a new team
   */
  createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team>;

  /**
   * Get a team by its ID
   */
  getTeamById(id: string): Promise<Team | null>;

  /**
   * Get teams that a user belongs to
   */
  getTeamsByUserId(userId: string): Promise<TeamWithMemberCount[]>;

  /**
   * Update a team
   */
  updateTeam(id: string, team: Partial<Team>): Promise<Team | null>;

  /**
   * Delete a team
   */
  deleteTeam(id: string): Promise<boolean>;

  /**
   * Check if a user has a specific role in a team
   */
  checkUserRole(teamId: string, userId: string, roles: string[]): Promise<boolean>;

  /**
   * Get the number of teams a user belongs to
   */
  getTeamCountByUserId(userId: string): Promise<number>;
}

/**
 * Interface for the team member repository
 */
export interface ITeamMemberRepository {
  /**
   * Add a member to a team
   */
  addTeamMember(
    teamMember: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TeamMember>;

  /**
   * Get team members by team ID
   */
  getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]>;

  /**
   * Get a team member by ID
   */
  getTeamMemberById(id: string): Promise<TeamMember | null>;

  /**
   * Get a team member by team ID and user ID
   */
  getTeamMemberByTeamAndUserId(teamId: string, userId: string): Promise<TeamMember | null>;

  /**
   * Update a team member
   */
  updateTeamMember(id: string, teamMember: Partial<TeamMember>): Promise<TeamMember | null>;

  /**
   * Delete a team member
   */
  deleteTeamMember(id: string): Promise<boolean>;

  /**
   * Get detailed team members with user information
   */
  getTeamMembersWithUserInfo(teamId: string): Promise<any[]>;

  /**
   * Count members in a team
   */
  countTeamMembers(teamId: string): Promise<number>;
}
