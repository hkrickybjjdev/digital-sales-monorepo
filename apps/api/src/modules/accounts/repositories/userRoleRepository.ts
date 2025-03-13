import { D1Database } from '@cloudflare/workers-types';
import { UserRole } from '../models/schemas';

export class UserRoleRepository {
  constructor(private readonly db: D1Database) {}
  
  async assignRole(userId: string, roleId: string): Promise<boolean> {
    try {
      await this.db.prepare(
        `INSERT INTO "UserRole" (userId, roleId)
         VALUES (?, ?)`
      )
      .bind(userId, roleId)
      .run();
      return true;
    } catch (error) {
      // Handle unique constraint violation or foreign key errors
      return false;
    }
  }
  
  async removeRole(userId: string, roleId: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "UserRole"
       WHERE userId = ? AND roleId = ?`
    )
    .bind(userId, roleId)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT COUNT(*) as count
       FROM "UserRole"
       WHERE userId = ? AND roleId = ?`
    )
    .bind(userId, roleId)
    .first<{ count: number }>();
    
    return result ? result.count > 0 : false;
  }
  
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const result = await this.db.prepare(
      `SELECT userId, roleId
       FROM "UserRole"
       WHERE userId = ?`
    )
    .bind(userId)
    .all<UserRole>();
    
    return result.results;
  }
  
  async getUsersByRole(roleId: string): Promise<string[]> {
    const result = await this.db.prepare(
      `SELECT userId
       FROM "UserRole"
       WHERE roleId = ?`
    )
    .bind(roleId)
    .all<{ userId: string }>();
    
    return result.results.map(row => row.userId);
  }
  
  async removeAllUserRoles(userId: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "UserRole"
       WHERE userId = ?`
    )
    .bind(userId)
    .run();
    
    return result.meta.changes > 0;
  }
}