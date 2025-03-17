import { D1Database } from '@cloudflare/workers-types';

import { Team, TeamWithMemberCount } from '../models/schemas';

import { ITeamRepository } from './interfaces';

import { generateUUID } from '@/utils/utils';

export class TeamRepository implements ITeamRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const id = generateUUID();
    const now = Math.floor(Date.now() / 1000);

    await this.db
      .prepare(
        `
      INSERT INTO "Team" (id, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `
      )
      .bind(id, team.name, now, now)
      .run();

    return {
      id,
      name: team.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getTeamById(id: string): Promise<Team | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM "Team" WHERE id = ?
    `
      )
      .bind(id)
      .first();

    return (result as Team) || null;
  }

  async getTeamsByUserId(userId: string): Promise<TeamWithMemberCount[]> {
    const results = await this.db
      .prepare(
        `
      SELECT t.*, COUNT(tm2.id) as memberCount 
      FROM "Team" t
      JOIN "TeamMember" tm ON t.id = tm.teamId
      LEFT JOIN "TeamMember" tm2 ON t.id = tm2.teamId
      WHERE tm.userId = ?
      GROUP BY t.id
      ORDER BY t.name ASC
    `
      )
      .bind(userId)
      .all();

    return (results.results || []).map(row => ({
      id: String(row.id),
      name: String(row.name),
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
      memberCount: Number(row.memberCount),
    }));
  }

  async updateTeam(id: string, team: Partial<Team>): Promise<Team | null> {
    const now = Math.floor(Date.now() / 1000);
    const updateFields = [];
    const values = [];

    if (team.name !== undefined) {
      updateFields.push('name = ?');
      values.push(team.name);
    }

    if (updateFields.length === 0) {
      // Nothing to update
      return this.getTeamById(id);
    }

    updateFields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db
      .prepare(
        `
      UPDATE "Team"
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `
      )
      .bind(...values)
      .run();

    return this.getTeamById(id);
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      DELETE FROM "Team" WHERE id = ?
    `
      )
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  async checkUserRole(teamId: string, userId: string, roles: string[]): Promise<boolean> {
    const result = await this.db
      .prepare(
        `
      SELECT 1 FROM "TeamMember" 
      WHERE teamId = ? 
      AND userId = ? 
      AND role IN (${roles.map(() => '?').join(', ')})
    `
      )
      .bind(teamId, userId, ...roles)
      .first();

    return result !== null;
  }

  async getTeamCountByUserId(userId: string): Promise<number> {
    const result = await this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM "TeamMember" WHERE userId = ?
    `
      )
      .bind(userId)
      .first<{ count: number }>();

    return result?.count || 0;
  }
}
