import { D1Database } from '@cloudflare/workers-types';
import { GroupRepository } from '../repositories/groupRepository';
import { CreateGroupRequest, Group, UpdateGroupRequest } from '../models/schemas';

export class GroupService {
  private groupRepository: GroupRepository;
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
    this.groupRepository = new GroupRepository(db);
  }
  
  async createGroup(data: CreateGroupRequest): Promise<Group> {
    return this.groupRepository.createGroup(data.name, data.organizationId);
  }
  
  async getGroupById(id: string): Promise<Group | null> {
    return this.groupRepository.getGroupById(id);
  }
  
  async updateGroup(id: string, data: UpdateGroupRequest): Promise<Group | null> {
    return this.groupRepository.updateGroup(id, data);
  }
  
  async deleteGroup(id: string): Promise<boolean> {
    // Groups can only be deleted if they have no users
    // This constraint is enforced by foreign key constraints in the database
    return this.groupRepository.deleteGroup(id);
  }
  
  async listGroupsByOrganization(organizationId: string): Promise<Group[]> {
    return this.groupRepository.listGroupsByOrganization(organizationId);
  }
  
  async getUsersInGroup(groupId: string): Promise<{ id: string; email: string; name: string }[]> {
    return this.groupRepository.getUsersInGroup(groupId);
  }
  
  async assignUserToGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      // This requires a separate user repository
      await this.db.prepare(
        `UPDATE "User" SET groupId = ? WHERE id = ?`
      )
      .bind(groupId, userId)
      .run();
      return true;
    } catch (error) {
      console.error('Error assigning user to group:', error);
      return false;
    }
  }
  
  async removeUserFromGroup(userId: string): Promise<boolean> {
    try {
      // Set groupId to NULL for the user
      await this.db.prepare(
        `UPDATE "User" SET groupId = NULL WHERE id = ?`
      )
      .bind(userId)
      .run();
      return true;
    } catch (error) {
      console.error('Error removing user from group:', error);
      return false;
    }
  }
}