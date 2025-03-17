import { D1Database } from '@cloudflare/workers-types';

import { Registration, CreateRegistrationRequest, Page } from '../models/schemas';
import { PageRepository } from '../repositories/pageRepository';
import { RegistrationRepository } from '../repositories/registrationRepository';
import {
  IRegistrationService,
  IRegistrationRepository,
  IPageRepository,
} from '../services/interfaces';

export class RegistrationService implements IRegistrationService {
  private registrationRepository: IRegistrationRepository;
  private pageRepository: IPageRepository;

  constructor(db: D1Database) {
    this.registrationRepository = new RegistrationRepository(db);
    this.pageRepository = new PageRepository(db);
  }

  async createRegistration(
    shortId: string,
    request: CreateRegistrationRequest
  ): Promise<{ registration: Registration | null; error?: string }> {
    // Get page by shortId
    const page = await this.pageRepository.getPageByShortId(shortId);

    if (!page) {
      return { registration: null, error: 'Page not found' };
    }

    // Check if page is active
    if (!page.isActive) {
      return { registration: null, error: 'This page is no longer active' };
    }

    // Check if page has expired
    if (page.expiresAt && new Date(page.expiresAt) < new Date()) {
      return { registration: null, error: 'This page has expired' };
    }

    // Check if page has launched
    if (page.launchAt && new Date(page.launchAt) > new Date()) {
      return { registration: null, error: 'This page has not launched yet' };
    }

    // For event registration pages, check if max attendees limit is reached
    if (page.type === 'event-registration' && 'maxAttendees' in page.settings) {
      const registrationCount = await this.registrationRepository.getRegistrationCount(page.id);
      const maxAttendees = page.settings.maxAttendees;

      if (maxAttendees && registrationCount >= maxAttendees) {
        // Check if waitlist is enabled
        if (!page.settings.waitlistEnabled) {
          return { registration: null, error: 'This event has reached its maximum capacity' };
        }
      }
    }

    // Create registration
    const registration = await this.registrationRepository.createRegistration(page.id, request);

    return { registration };
  }

  async getRegistrations(
    pageId: string,
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<{
    registrations: Registration[];
    total: number;
    hasMore: boolean;
  }> {
    const [registrations, total] = await Promise.all([
      this.registrationRepository.getRegistrations(pageId, userId, limit, offset),
      this.registrationRepository.getRegistrationCount(pageId),
    ]);

    return {
      registrations,
      total,
      hasMore: offset + registrations.length < total,
    };
  }

  async exportRegistrationsAsCsv(pageId: string, userId: string): Promise<string> {
    // Get all registrations for the page
    const { registrations } = await this.getRegistrations(pageId, userId, 1000, 0);

    if (registrations.length === 0) {
      return 'No registrations found';
    }

    // Determine all possible custom fields across all registrations
    const customFieldKeys = new Set<string>();
    registrations.forEach(registration => {
      if (registration.customFields) {
        Object.keys(registration.customFields).forEach(key => customFieldKeys.add(key));
      }
    });

    // Create CSV header
    const customFieldsArray = Array.from(customFieldKeys);
    const header = ['ID', 'Email', 'Name', 'Phone', 'Registered At', ...customFieldsArray];

    // Create CSV rows
    const rows = registrations.map(registration => {
      const row = [
        registration.id,
        registration.email,
        registration.name,
        registration.phone || '',
        registration.registeredAt,
      ];

      // Add custom fields
      customFieldsArray.forEach(key => {
        const value =
          registration.customFields && registration.customFields[key]
            ? registration.customFields[key]
            : '';
        row.push(String(value));
      });

      return row;
    });

    // Combine header and rows
    const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');

    return csvContent;
  }
}
