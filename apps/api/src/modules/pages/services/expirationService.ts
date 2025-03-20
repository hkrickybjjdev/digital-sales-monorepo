import { RequestContext } from '../../../database/sqlDatabase';
import { ExpirationSetting } from '../models/schemas';
import {
  IExpirationSettingRepository,
  IPageRepository,
  IPageVersionRepository,
} from '../repositories/interfaces';

import { IExpirationService } from './interfaces';

export class ExpirationService implements IExpirationService {
  constructor(
    private readonly expirationSettingRepository: IExpirationSettingRepository,
    private readonly pageRepository: IPageRepository,
    private readonly pageVersionRepository: IPageVersionRepository
  ) {}

  /**
   * Creates a new expiration setting
   */
  async createExpirationSetting(
    expirationType: 'datetime' | 'duration',
    expiresAtDatetime: number | null,
    durationSeconds: number | null,
    expirationAction: 'unpublish' | 'redirect',
    redirectUrl: string | null,
    context?: RequestContext
  ): Promise<ExpirationSetting> {
    // Validate input based on expiration type
    if (expirationType === 'datetime' && !expiresAtDatetime) {
      throw new Error('Expiration datetime is required for datetime expiration type');
    }

    if (expirationType === 'duration' && !durationSeconds) {
      throw new Error('Duration seconds is required for duration expiration type');
    }

    if (expirationAction === 'redirect' && !redirectUrl) {
      throw new Error('Redirect URL is required for redirect expiration action');
    }

    return this.expirationSettingRepository.createExpirationSetting(
      {
        expirationType,
        expiresAtDatetime,
        durationSeconds,
        expirationAction,
        redirectUrl,
      },
      context
    );
  }

  /**
   * Gets an expiration setting by its ID
   */
  async getExpirationSettingById(id: string): Promise<ExpirationSetting | null> {
    return this.expirationSettingRepository.getExpirationSettingById(id);
  }

  /**
   * Updates an expiration setting
   */
  async updateExpirationSetting(
    id: string,
    updates: Partial<ExpirationSetting>,
    context?: RequestContext
  ): Promise<ExpirationSetting | null> {
    // Get the existing setting to validate updates
    const existingSetting = await this.expirationSettingRepository.getExpirationSettingById(id);
    if (!existingSetting) {
      return null;
    }

    // Determine the expiration type for validation
    const expirationType = updates.expirationType || existingSetting.expirationType;
    const expirationAction = updates.expirationAction || existingSetting.expirationAction;

    // Validate updates based on expiration type
    if (
      expirationType === 'datetime' &&
      updates.expiresAtDatetime === null &&
      existingSetting.expiresAtDatetime === null
    ) {
      throw new Error('Expiration datetime is required for datetime expiration type');
    }

    if (
      expirationType === 'duration' &&
      updates.durationSeconds === null &&
      existingSetting.durationSeconds === null
    ) {
      throw new Error('Duration seconds is required for duration expiration type');
    }

    if (
      expirationAction === 'redirect' &&
      updates.redirectUrl === null &&
      existingSetting.redirectUrl === null
    ) {
      throw new Error('Redirect URL is required for redirect expiration action');
    }

    return this.expirationSettingRepository.updateExpirationSetting(id, updates, context);
  }

  /**
   * Deletes an expiration setting
   */
  async deleteExpirationSetting(id: string, context?: RequestContext): Promise<boolean> {
    return this.expirationSettingRepository.deleteExpirationSetting(id, context);
  }

  /**
   * Processes all page expirations - should be called via a scheduled task
   */
  async processExpirations(): Promise<void> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    // Get all published page versions with expirations
    const publishedVersions =
      await this.pageVersionRepository.getPublishedVersionsWithExpirations();

    for (const version of publishedVersions) {
      if (!version.expirationId) continue;

      // Get the expiration setting
      const expiration = await this.expirationSettingRepository.getExpirationSettingById(
        version.expirationId
      );

      if (!expiration) continue;

      // Calculate the expiration timestamp
      let expirationTimestamp: number | null = null;

      if (expiration.expirationType === 'datetime') {
        expirationTimestamp = expiration.expiresAtDatetime;
      } else if (
        expiration.expirationType === 'duration' &&
        version.publishedAt &&
        expiration.durationSeconds
      ) {
        expirationTimestamp = version.publishedAt + expiration.durationSeconds;
      }

      // Skip if no valid expiration timestamp
      if (!expirationTimestamp) continue;

      // Check if the page should be expired
      if (expirationTimestamp <= now) {
        // Handle expiration based on the action
        if (expiration.expirationAction === 'unpublish') {
          // Unpublish the version
          await this.pageVersionRepository.updatePageVersion(version.id, { isPublished: false });

          // Update the page status to expired
          await this.pageRepository.updatePage(version.pageId, { status: 'expired' });
        } else if (expiration.expirationAction === 'redirect' && expiration.redirectUrl) {
          // For redirect, we keep the page published but mark its status as expired
          // The frontend will handle the redirect based on this status
          await this.pageRepository.updatePage(version.pageId, { status: 'expired' });
        }
      }
    }
  }
}
