import { Env } from '../../../types';
import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService } from '../../../database/databaseService';
import { generateUUID } from '../../../utils/utils';
import { Registration, CreateRegistrationRequest } from '../models/schemas';
import { IRegistrationRepository } from '../services/interfaces';

export class RegistrationRepository implements IRegistrationRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createRegistration(
    pageId: string,
    request: CreateRegistrationRequest
  ): Promise<Registration> {
    const id = generateUUID();
    const now = Date.now();

    const registration: Registration = {
      id,
      pageId,
      email: request.email,
      name: request.name,
      phone: request.phone,
      registeredAt: now,
      customFields: request.customFields,
    };

    await this.dbService.executeWithAudit({
      sql: `
        INSERT INTO Registration (
          id, pageId, email, name, phone, registeredAt, customFields
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        registration.id,
        registration.pageId,
        registration.email,
        registration.name,
        registration.phone || null,
        registration.registeredAt,
        JSON.stringify(registration.customFields)
      ]
    }, {
      action: 'CREATE',
      resourceType: 'Registration',
      resourceId: registration.id,
      details: JSON.stringify({
        pageId: registration.pageId,
        email: registration.email,
        name: registration.name
      })
    });

    return registration;
  }

  async getRegistrations(
    pageId: string,
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<Registration[]> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return [];
    }

    const results = await this.dbService.queryMany<any>({
      sql: `
        SELECT * FROM Registration 
        WHERE pageId = ? 
        ORDER BY registeredAt DESC 
        LIMIT ? OFFSET ?
      `,
      params: [pageId, limit, offset]
    });

    return results.map(row => this.parseRegistrationResult(row));
  }

  async getRegistrationCount(pageId: string): Promise<number> {
    const result = await this.dbService.queryOne<{ count: number }>({
      sql: `SELECT COUNT(*) as count FROM Registration WHERE pageId = ?`,
      params: [pageId]
    });

    return result ? Number(result.count) : 0;
  }

  private async checkPageOwnership(pageId: string, userId: string): Promise<boolean> {
    const result = await this.dbService.queryOne<any>({
      sql: `SELECT 1 FROM Page WHERE id = ? AND userId = ?`,
      params: [pageId, userId]
    });

    return result !== null;
  }

  private parseRegistrationResult(result: any): Registration {
    return {
      id: result.id,
      pageId: result.pageId,
      email: result.email,
      name: result.name,
      phone: result.phone,
      registeredAt: Number(result.registeredAt),
      customFields: result.customFields ? JSON.parse(result.customFields) : {},
    };
  }
}
