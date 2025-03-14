import { D1Database } from '@cloudflare/workers-types';
import { v7 as uuidv7 } from 'uuid';
import { 
  Registration, 
  CreateRegistrationRequest
} from '../models/schemas';
import { IRegistrationRepository } from '../services/interfaces';

export class RegistrationRepository implements IRegistrationRepository {
  constructor(private readonly db: D1Database) {}

  async createRegistration(pageId: string, request: CreateRegistrationRequest): Promise<Registration> {
    const id = uuidv7();
    const now = new Date().toISOString();
    
    const registration: Registration = {
      id,
      pageId,
      email: request.email,
      name: request.name,
      phone: request.phone,
      registeredAt: now,
      customFields: request.customFields
    };
    
    await this.db.prepare(`
      INSERT INTO Registration (
        id, pageId, email, name, phone, registeredAt, customFields
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      registration.id,
      registration.pageId,
      registration.email,
      registration.name,
      registration.phone || null,
      registration.registeredAt,
      JSON.stringify(registration.customFields || {})
    ).run();
    
    return registration;
  }

  async getRegistrations(pageId: string, userId: string, limit = 100, offset = 0): Promise<Registration[]> {
    // First check if page exists and belongs to user
    const pageExists = await this.checkPageOwnership(pageId, userId);
    if (!pageExists) {
      return [];
    }
    
    const result = await this.db.prepare(`
      SELECT * FROM Registration 
      WHERE pageId = ? 
      ORDER BY registeredAt DESC
      LIMIT ? OFFSET ?
    `).bind(pageId, limit, offset).all();
    
    if (!result.results) return [];
    
    return result.results.map(row => this.parseRegistrationResult(row));
  }

  async getRegistrationCount(pageId: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM Registration WHERE pageId = ?
    `).bind(pageId).first();
    
    return result ? Number(result.count) : 0;
  }

  private async checkPageOwnership(pageId: string, userId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT id FROM Page WHERE id = ? AND userId = ?
    `).bind(pageId, userId).first();
    
    return !!result;
  }

  private parseRegistrationResult(result: any): Registration {
    return {
      id: result.id,
      pageId: result.pageId,
      email: result.email,
      name: result.name,
      phone: result.phone || undefined,
      registeredAt: result.registeredAt,
      customFields: JSON.parse(result.customFields || '{}')
    };
  }
}