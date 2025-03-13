import { D1Database } from '@cloudflare/workers-types';
import { OrganizationRepository } from '../repositories/organizationRepository';
import { 
  CreateOrganizationRequest, 
  Organization, 
  OrganizationWithGroups 
} from '../models/schemas';
import { v4 as uuidv4 } from 'uuid';

export class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private groupRepository: any; // Temporarily use 'any' until GroupRepository is updated
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
    this.organizationRepository = new OrganizationRepository(db);
    // We'll need to update GroupRepository to use the same pattern
    this.groupRepository = { 
      createGroup: async (name: string, organizationId: string) => {
        // Temporary implementation until GroupRepository is updated
        return { id: 'temp_group_id', name, organizationId };
      }
    };
  }
  
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    return this.organizationRepository.createOrganization(data.name, data.isEnterprise);
  }
  
  async getOrganizationById(id: string): Promise<Organization | null> {
    return this.organizationRepository.getOrganizationById(id);
  }
  
  async getOrganizationWithGroups(id: string): Promise<OrganizationWithGroups | null> {
    return this.organizationRepository.getOrganizationWithGroups(id);
  }
  
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization | null> {
    return this.organizationRepository.updateOrganization(id, data);
  }
  
  async deleteOrganization(id: string): Promise<boolean> {
    // Organizations can only be deleted if they have no users
    // This constraint is enforced by foreign key constraints in the database
    return this.organizationRepository.deleteOrganization(id);
  }
  
  async listOrganizations(limit = 50, offset = 0): Promise<Organization[]> {
    return this.organizationRepository.listOrganizations(limit, offset);
  }
  
  async createDefaultOrganization(isEnterprise: boolean = false): Promise<{ organization: Organization; group: any }> {
    // Create a new organization with a random name for non-enterprise users
    // For enterprise users, a proper name should be provided later
    const orgName = isEnterprise ? 'Enterprise Organization' : `Organization-${uuidv4().substring(0, 8)}`;
    const organization = await this.organizationRepository.createOrganization(orgName, isEnterprise);
    
    // Create a default group within the organization
    const groupName = isEnterprise ? 'Default Group' : `Group-${uuidv4().substring(0, 8)}`;
    const group = await this.groupRepository.createGroup(groupName, organization.id);
    
    return { organization, group };
  }
  
  /**
   * Check if a user is a member of an organization
   * 
   * @param userId The user ID to check
   * @param organizationId The organization ID to check membership for
   * @returns True if the user is a member of the organization, false otherwise
   */
  async isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(
        `SELECT 1 FROM "User" WHERE id = ? AND organizationId = ?`
      )
      .bind(userId, organizationId)
      .first();
      
      return result !== null;
    } catch (error) {
      console.error('Error checking if user is in organization:', error);
      return false;
    }
  }
}