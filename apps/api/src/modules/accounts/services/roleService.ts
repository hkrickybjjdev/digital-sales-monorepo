import { D1Database } from '@cloudflare/workers-types';
import { RoleRepository } from '../repositories/roleRepository';
import { UserRoleRepository } from '../repositories/userRoleRepository';
import { Role, UserPermissions } from '../models/schemas';

export class RoleService {
  private roleRepository: RoleRepository;
  private userRoleRepository: UserRoleRepository;
  
  constructor(db: D1Database) {
    this.roleRepository = new RoleRepository(db);
    this.userRoleRepository = new UserRoleRepository(db);
  }
  
  async getRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.getRoleById(id);
  }
  
  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.getRoleByName(name);
  }
  
  async createRole(name: string): Promise<Role> {
    return this.roleRepository.createRole(name);
  }
  
  async listRoles(): Promise<Role[]> {
    return this.roleRepository.listRoles();
  }
  
  async getUserRoles(userId: string): Promise<Role[]> {
    return this.roleRepository.getUserRoles(userId);
  }
  
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    return this.userRoleRepository.assignRole(userId, roleId);
  }
  
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    return this.userRoleRepository.removeRole(userId, roleId);
  }
  
  async removeAllUserRoles(userId: string): Promise<boolean> {
    return this.userRoleRepository.removeAllUserRoles(userId);
  }
  
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    return this.userRoleRepository.hasRole(userId, roleId);
  }
  
  async getUsersByRole(roleId: string): Promise<string[]> {
    return this.userRoleRepository.getUsersByRole(roleId);
  }
  
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const roles = await this.getUserRoles(userId);
    const roleNames = roles.map(role => role.name);
    
    // Default permissions (all false)
    const permissions: UserPermissions = {
      canManageOrganization: false,
      canManageUsers: false,
      canCreatePages: false,
      canViewAnalytics: false,
      canManageSubscriptions: false,
      canManageProducts: false,
      canInviteUsers: false
    };
    
    // Apply permissions based on roles
    if (roleNames.includes('admin')) {
      // Admin has all permissions
      Object.keys(permissions).forEach(key => {
        permissions[key as keyof UserPermissions] = true;
      });
    } else {
      // Apply specific permissions based on role
      if (roleNames.includes('manager')) {
        permissions.canManageUsers = true;
        permissions.canCreatePages = true;
        permissions.canViewAnalytics = true;
        permissions.canManageProducts = true;
        permissions.canInviteUsers = true;
      }
      
      if (roleNames.includes('editor')) {
        permissions.canCreatePages = true;
        permissions.canManageProducts = true;
      }
      
      if (roleNames.includes('viewer')) {
        permissions.canViewAnalytics = true;
      }
    }
    
    return permissions;
  }
}