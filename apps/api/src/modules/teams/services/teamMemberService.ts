import { 
  TeamMember,
  AddTeamMemberRequest, 
  UpdateTeamMemberRequest
} from '../models/schemas';
import { ITeamMemberService } from './interfaces';
import { ITeamRepository, ITeamMemberRepository } from '../repositories/interfaces';

export class TeamMemberService implements ITeamMemberService {
  private teamRepository: ITeamRepository;
  private teamMemberRepository: ITeamMemberRepository;
  private maxMembersPerTeam: number;

  constructor(
    teamRepository: ITeamRepository, 
    teamMemberRepository: ITeamMemberRepository,
    maxMembersPerTeam: number = 10
  ) {
    this.teamRepository = teamRepository;
    this.teamMemberRepository = teamMemberRepository;
    this.maxMembersPerTeam = maxMembersPerTeam;
  }

  async addTeamMember(teamId: string, currentUserId: string, data: AddTeamMemberRequest): Promise<TeamMember> {
    // Check if the current user has permission to add members
    const hasPermission = await this.teamRepository.checkUserRole(teamId, currentUserId, ['owner', 'admin']);
    if (!hasPermission) {
      throw new Error('You do not have permission to add members to this team');
    }

    // Check if team has reached its member limit
    const memberCount = await this.teamMemberRepository.countTeamMembers(teamId);
    if (memberCount >= this.maxMembersPerTeam) {
      throw new Error(`Teams can have a maximum of ${this.maxMembersPerTeam} members with your current plan`);
    }

    // Check if the user is already a member of the team
    const existingMember = await this.teamMemberRepository.getTeamMemberByTeamAndUserId(teamId, data.userId);
    if (existingMember) {
      throw new Error('User is already a member of this team');
    }

    // Add restrictions on who can add owners
    if (data.role === 'owner') {
      const isOwner = await this.teamRepository.checkUserRole(teamId, currentUserId, ['owner']);
      if (!isOwner) {
        throw new Error('Only team owners can add new owners');
      }
    }

    // Add the member
    return this.teamMemberRepository.addTeamMember({
      teamId,
      userId: data.userId,
      role: data.role
    });
  }

  async updateTeamMember(
    teamId: string, 
    memberId: string, 
    currentUserId: string, 
    data: UpdateTeamMemberRequest
  ): Promise<TeamMember | null> {
    // Get the member to update
    const member = await this.teamMemberRepository.getTeamMemberById(memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    // Verify the member belongs to the specified team
    if (member.teamId !== teamId) {
      throw new Error('Team member does not belong to this team');
    }

    // Check permissions
    const currentUserRole = await this.getUserRoleInTeam(teamId, currentUserId);
    if (!currentUserRole) {
      throw new Error('You are not a member of this team');
    }

    // Permission rules:
    // 1. Owners can update any member
    // 2. Admins can update members or viewers, but not owners or other admins
    // 3. Members and viewers cannot update roles
    if (currentUserRole === 'owner') {
      // Owners can update anyone except changing another owner's role
      if (member.role === 'owner' && data.role !== 'owner' && member.userId !== currentUserId) {
        // Check if this would remove the last owner
        const owners = (await this.teamMemberRepository.getTeamMembersByTeamId(teamId))
          .filter(m => m.role === 'owner');
        
        if (owners.length <= 1) {
          throw new Error('Cannot change the role of the last owner');
        }
      }
    } else if (currentUserRole === 'admin') {
      // Admins can only update members and viewers
      if (member.role === 'owner' || member.role === 'admin') {
        throw new Error('Admins cannot modify owners or other admins');
      }
    } else {
      // Members and viewers cannot update roles
      throw new Error('You do not have permission to update team roles');
    }

    // Update the member
    return this.teamMemberRepository.updateTeamMember(memberId, {
      role: data.role
    });
  }

  async removeTeamMember(teamId: string, memberId: string, currentUserId: string): Promise<boolean> {
    // Get the member to remove
    const member = await this.teamMemberRepository.getTeamMemberById(memberId);
    if (!member) {
      throw new Error('Team member not found');
    }

    // Verify the member belongs to the specified team
    if (member.teamId !== teamId) {
      throw new Error('Team member does not belong to this team');
    }

    // Check permissions
    const currentUserRole = await this.getUserRoleInTeam(teamId, currentUserId);
    if (!currentUserRole) {
      throw new Error('You are not a member of this team');
    }

    // Permission rules for removal:
    // 1. Users can remove themselves (leave team)
    // 2. Owners can remove anyone except the last owner
    // 3. Admins can remove members and viewers
    if (member.userId === currentUserId) {
      // User is removing themselves
      // If they're the last owner, don't allow it
      if (member.role === 'owner') {
        const owners = (await this.teamMemberRepository.getTeamMembersByTeamId(teamId))
          .filter(m => m.role === 'owner');
        
        if (owners.length <= 1) {
          throw new Error('Cannot remove the last owner from the team');
        }
      }
    } else if (currentUserRole === 'owner') {
      // Owner is removing someone else
      // No additional checks needed, owners can remove anyone except the last owner
      if (member.role === 'owner') {
        const owners = (await this.teamMemberRepository.getTeamMembersByTeamId(teamId))
          .filter(m => m.role === 'owner');
        
        if (owners.length <= 1) {
          throw new Error('Cannot remove the last owner from the team');
        }
      }
    } else if (currentUserRole === 'admin') {
      // Admin is removing someone else
      if (member.role === 'owner' || member.role === 'admin') {
        throw new Error('Admins cannot remove owners or other admins');
      }
    } else {
      // Members and viewers cannot remove others
      throw new Error('You do not have permission to remove team members');
    }

    // Remove the member
    return this.teamMemberRepository.deleteTeamMember(memberId);
  }

  // Helper method to get a user's role in a team
  private async getUserRoleInTeam(teamId: string, userId: string): Promise<string | null> {
    const member = await this.teamMemberRepository.getTeamMemberByTeamAndUserId(teamId, userId);
    return member ? member.role : null;
  }
}