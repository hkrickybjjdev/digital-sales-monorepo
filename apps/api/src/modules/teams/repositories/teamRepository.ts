import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { generateUUID, generateShortID } from '../../../utils/utils';
import { Team, TeamWithMemberCount } from '../models/schemas';

import { ITeamRepository } from './interfaces';

export class TeamRepository implements ITeamRepository {
  constructor(private readonly dbService: SQLDatabase) {}

  async createTeam(
    team: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'slug'>,
    context?: RequestContext
  ): Promise<Team> {
    const id = generateUUID();
    const now = Date.now();
    const slug = generateShortID(10);

    await this.dbService.executeWithAudit(
      {
        sql: `
        INSERT INTO "Team" (id, name, slug, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `,
        params: [id, team.name, slug, now, now],
      },
      {
        eventType: 'team_created',
        resourceType: 'Team',
        resourceId: id,
        details: JSON.stringify({ name: team.name, slug }),
        outcome: 'success',
      },
      context
    );

    return {
      id,
      name: team.name,
      slug,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getTeamById(id: string): Promise<Team | null> {
    const result = await this.dbService.queryOne<Team>({
      sql: `SELECT * FROM "Team" WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getTeamsByUserId(userId: string): Promise<TeamWithMemberCount[]> {
    const results = await this.dbService.queryMany<TeamWithMemberCount>({
      sql: `
        SELECT 
          t.id, 
          t.name, 
          t.slug,
          t.createdAt, 
          t.updatedAt,
          COUNT(tm.id) as memberCount
        FROM "Team" t
        JOIN "TeamMember" tm ON t.id = tm.teamId
        WHERE tm.userId = ?
        GROUP BY t.id
      `,
      params: [userId],
    });

    return results.map(team => ({
      ...team,
      createdAt: Number(team.createdAt),
      updatedAt: Number(team.updatedAt),
      memberCount: Number(team.memberCount),
    }));
  }

  async updateTeam(
    id: string,
    team: Partial<Team>,
    context?: RequestContext
  ): Promise<Team | null> {
    const existingTeam = await this.getTeamById(id);
    if (!existingTeam) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (team.name !== undefined) {
      updates.push('name = ?');
      values.push(team.name);
    }

    if (updates.length === 0) {
      return existingTeam;
    }

    const now = Date.now();
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE "Team" 
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
        params: values,
      },
      {
        eventType: 'team_updated',
        resourceType: 'Team',
        resourceId: id,
        details: JSON.stringify(team),
        outcome: 'success',
      },
      context
    );

    return this.getTeamById(id);
  }

  async deleteTeam(id: string, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM "Team" WHERE id = ?`,
        params: [id],
      },
      {
        eventType: 'team_deleted',
        resourceType: 'Team',
        resourceId: id,
        outcome: 'success',
      },
      context
    );

    return true;
  }

  async checkUserRole(teamId: string, userId: string, roles: string[]): Promise<boolean> {
    const result = await this.dbService.queryOne<{ role: string }>({
      sql: `
        SELECT role FROM "TeamMember" 
        WHERE teamId = ? AND userId = ?
      `,
      params: [teamId, userId],
    });

    if (!result) return false;

    return roles.includes(result.role);
  }

  async getTeamCountByUserId(userId: string): Promise<number> {
    const result = await this.dbService.queryOne<{ count: number }>({
      sql: `
        SELECT COUNT(DISTINCT t.id) as count
        FROM "Team" t
        JOIN "TeamMember" tm ON t.id = tm.teamId
        WHERE tm.userId = ?
      `,
      params: [userId],
    });

    return result ? Number(result.count) : 0;
  }
}
