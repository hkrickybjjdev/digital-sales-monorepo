import { D1Database } from '@cloudflare/workers-types';
import { Role } from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

export class RoleRepository {
  constructor(private readonly db: D1Database) {}
  
  async getRoleById(id: string): Promise<Role | null> {
    const result = await this.db.prepare(
      `SELECT id, name
       FROM "Role"
       WHERE id = ?`
    )
    .bind(id)
    .first<Role>();
    
    return result;
  }
  
  async getRoleByName(name: string): Promise<Role | null> {
    const result = await this.db.prepare(
      `SELECT id, name
       FROM "Role"
       WHERE name = ?`
    )
    .bind(name)
    .first<Role>();
    
    return result;
  }
  
  async createRole(name: string): Promise<Role> {
    const id = `role_${uuidv4()}`;
    
    await this.db.prepare(
      `INSERT INTO "Role" (id, name)
       VALUES (?, ?)`
    )
    .bind(id, name)
    .run();
    
    return {
      id,
      name
    };
  }
  
  async listRoles(): Promise<Role[]> {
    const result = await this.db.prepare(
      `SELECT id, name
       FROM "Role"
       ORDER BY name ASC`
    )
    .all<Role>();
    
    return result.results;
  }
  
  async deleteRole(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "Role"
       WHERE id = ?`
    )
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await this.db.prepare(
      `SELECT r.id, r.name
       FROM "Role" r
       JOIN "UserRole" ur ON r.id = ur.roleId
       WHERE ur.userId = ?
       ORDER BY r.name ASC`
    )
    .bind(userId)
    .all<Role>();
    
    return result.results;
  }
}