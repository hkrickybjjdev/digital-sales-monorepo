import { D1Database } from '@cloudflare/workers-types';
import { OrganizationService } from '../services/organizationService';
import { RoleService } from '../services/roleService';
import { SubscriptionService } from '../services/subscriptionService';
import { GroupService } from '../services/groupService';
import { generateShortID } from '../../../utils/utils';

export class AuthIntegration {
  private organizationService: OrganizationService;
  private roleService: RoleService;
  private subscriptionService: SubscriptionService;
  private groupService: GroupService;
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
    this.organizationService = new OrganizationService(db);
    this.roleService = new RoleService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.groupService = new GroupService(db);
  }
  
  /**
   * Handle user registration webhook from auth module
   * This creates an organization, assigns roles, and creates a default subscription
   */
  async onUserRegistration(userId: string, isEnterprise: boolean = false): Promise<{
    organizationId?: string;
    groupId?: string;
    defaultRoleId?: string;
    subscriptionId?: string;
  }> {
    try {
      // 1. Get basic user info from the auth module
      // Since we don't have a UserRepository, we'll assume the user exists
      // and use a generic name for the organization
      
      // 2. Create a new organization for the user
      const orgName = isEnterprise ? `Enterprise Org ${userId.slice(0, 6)}` : `org-${generateShortID(8)}`;
      const organization = await this.organizationService.createOrganization({
        name: orgName,        
        isEnterprise
      });
      
      if (!organization) {
        throw new Error('Failed to create organization');
      }
      
      // 3. Create a default group for the organization
      const groupName = isEnterprise ? 'Default Group' : `group-${generateShortID(6)}`;
      const group = await this.groupService.createGroup({
        name: groupName,
        organizationId: organization.id
      });
      
      // 4. Assign user to the organization and group
      // Since we don't have a UserRepository, we'll use the GroupService to assign the user to the group
      await this.groupService.assignUserToGroup(userId, group.id);
      
      // 5. Assign default role
      let defaultRoleId;
      
      const adminRole = await this.roleService.getRoleByName('admin');
      if (adminRole) {
        await this.roleService.assignRoleToUser(userId, adminRole.id);
        defaultRoleId = adminRole.id;
      }
      
      // 6. Create a subscription (free plan for regular users, trial for enterprise)      
      
      // For simplicity, we'll just assign the free plan to all users
      // In a real implementation, you'd have logic to determine the appropriate plan
      const subscription = await this.subscriptionService.assignFreePlanToUser(userId);
      
      return {
        organizationId: organization.id,
        groupId: group.id,
        defaultRoleId,
        subscriptionId: subscription!.id
      };
    } catch (error) {
      console.error('Error in onUserRegistration:', error);
      throw error;
    }
  }
  
  /**
   * Handle user update webhook from auth module
   */
  async onUserUpdate(userId: string, userData: any): Promise<boolean> {
    try {
      // Since we don't have a UserRepository, we'll just log the update
      console.log(`User update received for ${userId}:`, userData);
      return true;
    } catch (error) {
      console.error('Error in onUserUpdate:', error);
      return false;
    }
  }
  
  /**
   * Handle user deletion webhook from auth module
   * This cleans up all user data from our system
   */
  async onUserDeletion(userId: string): Promise<boolean> {
    try {
      // 1. Cancel any active subscriptions
      const subscription = await this.subscriptionService.getActiveSubscriptionByUser(userId);
      if (subscription) {
        await this.subscriptionService.cancelSubscription(subscription.id);
      }
      
      // 2. Remove all role assignments
      await this.roleService.removeAllUserRoles(userId);
      
      // 3. Remove user from groups
      // This is handled by foreign key constraints or we can use GroupService
      await this.groupService.removeUserFromGroup(userId);
      
      return true;
    } catch (error) {
      console.error('Error in onUserDeletion:', error);
      return false;
    }
  }
}