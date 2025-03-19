import { DatabaseFactory } from '../../../database/databaseFactory';
import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { Env } from '../../../types';
import { generateUUID } from '../../../utils/utils';
import { TeamMember, TeamMemberWithUser } from '../models/schemas';

import { ITeamMemberRepository } from './interfaces';

export class TeamMemberRepository implements ITeamMemberRepository {
  private dbService: SQLDatabase;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async addTeamMember(
    teamMember: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<TeamMember> {
    const id = generateUUID();
    const now = Date.now();

    await this.dbService.executeWithAudit(
      {
        sql: `
        INSERT INTO "TeamMember" (id, teamId, userId, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        params: [id, teamMember.teamId, teamMember.userId, teamMember.role, now, now],
      },
      {
        eventType: 'team_member_created',
        userId: teamMember.userId,
        resourceType: 'TeamMember',
        resourceId: id,
        details: JSON.stringify({
          teamId: teamMember.teamId,
          role: teamMember.role,
        }),
        outcome: 'success',
      },
      context
    );

    return {
      id,
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      role: teamMember.role,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]> {
    const results = await this.dbService.queryMany<TeamMember>({
      sql: `SELECT * FROM "TeamMember" WHERE teamId = ? ORDER BY role ASC`,
      params: [teamId],
    });

    return results.map(member => ({
      ...member,
      createdAt: Number(member.createdAt),
      updatedAt: Number(member.updatedAt),
    }));
  }

  async getTeamMemberById(id: string): Promise<TeamMember | null> {
    const result = await this.dbService.queryOne<TeamMember>({
      sql: `SELECT * FROM "TeamMember" WHERE id = ?`,
      params: [id],
    });

    if (!result) return null;

    return {
      ...result,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
    };
  }

  async getTeamMemberByTeamAndUserId(teamId: string, userId: string): Promise<TeamMember | null> {
    const result = await this.dbService.queryOne<TeamMember>({
      sql: `SELECT * FROM "TeamMember" WHERE teamId = ? AND userId = ?`,
      params: [teamId, userId],
    });

    if (!result) return null;

    return {
      ...result,
      createdAt: Number(result.createdAt),
      updatedAt: Number(result.updatedAt),
    };
  }

  async updateTeamMember(
    id: string,
    teamMember: Partial<TeamMember>,
    context?: RequestContext
  ): Promise<TeamMember | null> {
    const existingMember = await this.getTeamMemberById(id);
    if (!existingMember) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (teamMember.role !== undefined) {
      updates.push('role = ?');
      values.push(teamMember.role);
    }

    if (updates.length === 0) {
      return existingMember;
    }

    const now = Date.now();
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
        UPDATE "TeamMember" 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `,
        params: values,
      },
      {
        eventType: 'team_member_updated',
        userId: existingMember.userId,
        resourceType: 'TeamMember',
        resourceId: id,
        details: JSON.stringify({
          teamId: existingMember.teamId,
          ...teamMember,
        }),
        outcome: 'success',
      },
      context
    );

    return this.getTeamMemberById(id);
  }

  async deleteTeamMember(id: string, context?: RequestContext): Promise<boolean> {
    const member = await this.getTeamMemberById(id);
    if (!member) return false;

    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM "TeamMember" WHERE id = ?`,
        params: [id],
      },
      {
        eventType: 'team_member_deleted',
        userId: member.userId,
        resourceType: 'TeamMember',
        resourceId: id,
        details: JSON.stringify({ teamId: member.teamId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }

  async getTeamMembersWithUserInfo(teamId: string): Promise<TeamMemberWithUser[]> {
    const results = await this.dbService.queryMany<TeamMemberWithUser>({
      sql: `
        SELECT 
          tm.*, 
          u.email as userEmail, 
          u.name as userName
        FROM "TeamMember" tm
        JOIN "User" u ON tm.userId = u.id
        WHERE tm.teamId = ?
        ORDER BY 
          CASE tm.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'member' THEN 3 
            WHEN 'viewer' THEN 4 
            ELSE 5 
          END
      `,
      params: [teamId],
    });

    return results.map(member => ({
      ...member,
      createdAt: Number(member.createdAt),
      updatedAt: Number(member.updatedAt),
    }));
  }

  async countTeamMembers(teamId: string): Promise<number> {
    const result = await this.dbService.queryOne<{ count: number }>({
      sql: `SELECT COUNT(*) as count FROM "TeamMember" WHERE teamId = ?`,
      params: [teamId],
    });

    return result ? Number(result.count) : 0;
  }
}
