import { D1Database } from '@cloudflare/workers-types';
import { Organization, OrganizationWithGroups, Group } from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

// Create a class that takes the database as a constructor parameter
export class OrganizationRepository {
  constructor(private readonly db: D1Database) {}
  
  async createOrganization(name: string, isEnterprise = false): Promise<Organization> {
    const id = `org_${uuidv4()}`;
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO "Organization" (id, name, isEnterprise, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, name, isEnterprise ? 1 : 0, now, now)
    .run();
    
    return {
      id,
      name,
      isEnterprise,
      createdAt: now,
      updatedAt: now
    };
  }
  
  async getOrganizationById(id: string): Promise<Organization | null> {
    const result = await this.db.prepare(
      `SELECT id, name, isEnterprise, createdAt, updatedAt
       FROM "Organization"
       WHERE id = ?`
    )
    .bind(id)
    .first<Organization>();
    
    if (!result) return null;
    
    return {
      ...result,
      isEnterprise: Boolean(result.isEnterprise)
    };
  }
  
  async getOrganizationWithGroups(id: string): Promise<OrganizationWithGroups | null> {
    const organization = await this.getOrganizationById(id);
    if (!organization) return null;
    
    const groups = await this.db.prepare(
      `SELECT id, organizationId, name, createdAt, updatedAt
       FROM "Group"
       WHERE organizationId = ?
       ORDER BY name ASC`
    )
    .bind(id)
    .all<Group>();
    
    return {
      ...organization,
      groups: groups.results || []
    };
  }
  
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | null> {
    const org = await this.getOrganizationById(id);
    if (!org) return null;
    
    const now = new Date().toISOString();
    const updates = [];
    const params = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    
    if (data.isEnterprise !== undefined) {
      updates.push('isEnterprise = ?');
      params.push(data.isEnterprise ? 1 : 0);
    }
    
    if (updates.length === 0) return org;
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);
    
    const statement = this.db.prepare(
      `UPDATE "Organization" 
       SET ${updates.join(', ')}
       WHERE id = ?`
    );
    
    // Bind all parameters
    let bindStatement = statement;
    for (const param of params) {
      bindStatement = bindStatement.bind(param);
    }
    
    await bindStatement.run();
    
    return this.getOrganizationById(id);
  }
  
  async deleteOrganization(id: string): Promise<boolean> {
    const result = await this.db.prepare(
      `DELETE FROM "Organization"
       WHERE id = ?`
    )
    .bind(id)
    .run();
    
    return result.meta.changes > 0;
  }
  
  async listOrganizations(limit = 50, offset = 0): Promise<Organization[]> {
    const result = await this.db.prepare(
      `SELECT id, name, isEnterprise, createdAt, updatedAt
       FROM "Organization"
       ORDER BY name ASC
       LIMIT ? OFFSET ?`
    )
    .bind(limit, offset)
    .all<Organization>();
    
    return result.results.map((org: Organization) => ({
      ...org,
      isEnterprise: Boolean(org.isEnterprise)
    }));
  }
}