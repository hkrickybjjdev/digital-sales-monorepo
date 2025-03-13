import { D1Database } from '@cloudflare/workers-types';
import { Group } from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

export class GroupRepository {
  constructor(private readonly db: D1Database) {}
  
  async createGroup(name: string, organizationId: string): Promise<Group> {
    const id = `group_${uuidv4()}`;
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO "Group" (id, organizationId, name, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, organizationId, name, now, now)
    .run();
    
    return {
      id,
      organizationId,
      name,
      createdAt: now,
      updatedAt: now
    };
  }
  
  async getGroupById(id: string): Promise<Group | null> {
    const result = await this.db.prepare(
      `SELECT id, organizationId, name, createdAt, updatedAt
       FROM "Group"
       WHERE id = ?`
    )
    .bind(id)
    .first<Group>();
    
    return result;
  }
  
  async updateGroup(id: string, data: Partial<Group>): Promise<Group | null> {
    const group = await this.getGroupById(id);
    if (!group) return null;
    
    const now = new Date().toISOString();
    const updates = [];
    const params = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    
    if (updates.length === 0) return group;
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);
    
    const statement = this.db.prepare(
      `UPDATE "Group" 
       SET ${updates.join(', ')}
       WHERE id = ?`
    );
    
    // Bind all parameters
    let bindStatement = statement;
    for (const param of params) {
      bindStatement = bindStatement.bind(param);
    }
    
    await bindStatement.run();
    
    return this.getGroupById(id);
  }
  
  async deleteGroup(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "Group"
       WHERE id = ?`
    )
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async listGroupsByOrganization(organizationId: string): Promise<Group[]> {
    const result = await this.db.prepare(
      `SELECT id, organizationId, name, createdAt, updatedAt
       FROM "Group"
       WHERE organizationId = ?
       ORDER BY name ASC`
    )
    .bind(organizationId)
    .all<Group>();
    
    return result.results;
  }
  
  async getUsersInGroup(groupId: string): Promise<{ id: string; email: string; name: string }[]> {
    const result = await this.db.prepare(
      `SELECT id, email, name
       FROM "User"
       WHERE groupId = ?
       ORDER BY name ASC`
    )
    .bind(groupId)
    .all<{ id: string; email: string; name: string }>();
    
    return result.results;
  }
}