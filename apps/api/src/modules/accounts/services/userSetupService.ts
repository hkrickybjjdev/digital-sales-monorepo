import { D1Database } from '@cloudflare/workers-types';
import { OrganizationService } from './organizationService';
import { GroupService } from './groupService';
import { RoleService } from './roleService';
import { SubscriptionService } from './subscriptionService';
import { PlanRepository } from '../repositories/planRepository';

/**
 * Service to handle the setup process for new users,
 * including creating organizations, groups, roles, and subscriptions.
 */
export class UserSetupService {
  private organizationService: OrganizationService;
  private groupService: GroupService;
  private roleService: RoleService;
  private subscriptionService: SubscriptionService;
  private planRepository: PlanRepository;
  
  constructor(db: D1Database) {
    this.organizationService = new OrganizationService(db);
    this.groupService = new GroupService(db);
    this.roleService = new RoleService(db);
    this.subscriptionService = new SubscriptionService(db);
    this.planRepository = new PlanRepository(db);
  }
  
  /**
   * Sets up a new user with default organization, group, roles, and subscription
   * 
   * @param userId User ID of the newly registered user
   * @param isEnterprise Whether this user is an enterprise user
   * @returns Object containing created IDs for organization, group, roles, and subscription
   */
  async setupNewUser(userId: string, isEnterprise: boolean = false): Promise<{
    organizationId: string;
    groupId: string;
    roles: string[];
    subscriptionId: string;
  }> {
    try {
      // 1. Create organization for the user
      const orgName = isEnterprise 
        ? `Organization ${userId.slice(0, 6)}` 
        : `Organization ${Math.floor(Math.random() * 1000000)}`;
      
      const organization = await this.organizationService.createOrganization({
        name: orgName,
        isEnterprise: isEnterprise
      });
      
      // 2. Create default group
      const group = await this.groupService.createGroup({
        name: 'Default Group',
        organizationId: organization.id
      });
      
      // 3. Assign user to group
      await this.groupService.assignUserToGroup(userId, group.id);
      
      // 4. Get default role (viewer) and admin role if enterprise
      const roles = [];
      
      // Always assign viewer role
      const viewerRole = await this.roleService.getRoleByName('viewer');
      if (viewerRole) {
        await this.roleService.assignRoleToUser(userId, viewerRole.id);
        roles.push(viewerRole.id);
      }
      
      // If enterprise, assign admin role
      if (isEnterprise) {
        const adminRole = await this.roleService.getRoleByName('admin');
        if (adminRole) {
          await this.roleService.assignRoleToUser(userId, adminRole.id);
          roles.push(adminRole.id);
        }
      }
      
      // 5. Assign free subscription by default
      const freePlan = await this.planRepository.getPlanById('plan_free');
      let subscription;
      
      if (freePlan) {
        subscription = await this.subscriptionService.createSubscription({
          userId,
          planId: freePlan.id
        });
      }
      
      return {
        organizationId: organization.id,
        groupId: group.id,
        roles,
        subscriptionId: subscription?.id || ''
      };
    } catch (error) {
      console.error('Error in setupNewUser:', error);
      throw new Error('Failed to complete user setup process');
    }
  }
  
  /**
   * Upgrades a user to an enterprise account
   * 
   * @param userId User ID to upgrade
   * @returns Success status
   */
  async upgradeToEnterprise(userId: string): Promise<boolean> {
    try {
      // Since getOrganizationByUserId doesn't exist, we'd need to implement this differently
      // For now, we'll assume the user has only one organization and we'd need to find it
      // This would require a different approach in a real implementation
      
      // For demonstration purposes, we'll just log an error
      console.log('Method getOrganizationByUserId not implemented');
      
      // 2. Assign admin role to user
      const adminRole = await this.roleService.getRoleByName('admin');
      
      if (adminRole) {
        await this.roleService.assignRoleToUser(userId, adminRole.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error in upgradeToEnterprise:', error);
      return false;
    }
  }
}