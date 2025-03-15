import { D1Database } from '@cloudflare/workers-types';
import { ITeamMemberRepository } from './interfaces';
import { TeamMember, TeamMemberWithUser } from '../models/schemas';
import { nanoid } from 'nanoid';

export class TeamMemberRepository implements ITeamMemberRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async addTeamMember(teamMember: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);
    
    await this.db.prepare(`
      INSERT INTO "TeamMember" (id, teamId, userId, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(id, teamMember.teamId, teamMember.userId, teamMember.role, now, now)
    .run();
    
    return {
      id,
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      role: teamMember.role,
      createdAt: now,
      updatedAt: now
    };
  }

  async getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]> {
    const results = await this.db.prepare(`
      SELECT * FROM "TeamMember" WHERE teamId = ? ORDER BY role ASC
    `)
    .bind(teamId)
    .all();
    
    return results.results as TeamMember[] || [];
  }

  async getTeamMemberById(id: string): Promise<TeamMember | null> {
    const result = await this.db.prepare(`
      SELECT * FROM "TeamMember" WHERE id = ?
    `)
    .bind(id)
    .first();
    
    return result as TeamMember || null;
  }

  async getTeamMemberByTeamAndUserId(teamId: string, userId: string): Promise<TeamMember | null> {
    const result = await this.db.prepare(`
      SELECT * FROM "TeamMember" WHERE teamId = ? AND userId = ?
    `)
    .bind(teamId, userId)
    .first();
    
    return result as TeamMember || null;
  }

  async updateTeamMember(id: string, teamMember: Partial<TeamMember>): Promise<TeamMember | null> {
    const now = Math.floor(Date.now() / 1000);
    const updateFields = [];
    const values = [];
    
    if (teamMember.role !== undefined) {
      updateFields.push('role = ?');
      values.push(teamMember.role);
    }
    
    if (updateFields.length === 0) {
      // Nothing to update
      return this.getTeamMemberById(id);
    }
    
    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    
    await this.db.prepare(`
      UPDATE "TeamMember"
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `)
    .bind(...values)
    .run();
    
    return this.getTeamMemberById(id);
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM "TeamMember" WHERE id = ?
    `)
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }

  async getTeamMembersWithUserInfo(teamId: string): Promise<TeamMemberWithUser[]> {
    const results = await this.db.prepare(`
      SELECT tm.*, u.id as userId, u.email, u.name 
      FROM "TeamMember" tm
      JOIN "User" u ON tm.userId = u.id
      WHERE tm.teamId = ?
      ORDER BY 
        CASE 
          WHEN tm.role = 'owner' THEN 1
          WHEN tm.role = 'admin' THEN 2
          WHEN tm.role = 'member' THEN 3
          WHEN tm.role = 'viewer' THEN 4
          ELSE 5
        END
    `)
    .bind(teamId)
    .all();
    
    return results.results.map((row: any) => ({
      id: row.id,
      teamId: row.teamId,
      userId: row.userId,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        name: row.name,
        email: row.email
      }
    }));
  }

  async countTeamMembers(teamId: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM "TeamMember" WHERE teamId = ?
    `)
    .bind(teamId)
    .first<{ count: number }>();
    
    return result?.count || 0;
  }
}