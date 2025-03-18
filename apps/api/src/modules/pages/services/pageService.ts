import { RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import {
  Page,
  PageVersion,
  PageVersionTranslation,
  ContentBlock,
  ContentBlockTranslation,
  CreatePageRequest,
  SavePageDraftRequest,
  PublishPageRequest,
  PageWithVersion,
  ExpirationSetting,
} from '../models/schemas';
import {
  IPageRepository,
  IPageVersionRepository,
  IPageVersionTranslationRepository,
  IContentBlockRepository,
  IContentBlockTranslationRepository,
  IExpirationSettingRepository,
} from '../repositories/interfaces';

import { IPageService } from './interfaces';

export class PageService implements IPageService {
  private pageRepository: IPageRepository;
  private pageVersionRepository: IPageVersionRepository;
  private pageVersionTranslationRepository: IPageVersionTranslationRepository;
  private contentBlockRepository: IContentBlockRepository;
  private contentBlockTranslationRepository: IContentBlockTranslationRepository;
  private expirationSettingRepository: IExpirationSettingRepository;

  constructor(
    pageRepository: IPageRepository,
    pageVersionRepository: IPageVersionRepository,
    pageVersionTranslationRepository: IPageVersionTranslationRepository,
    contentBlockRepository: IContentBlockRepository,
    contentBlockTranslationRepository: IContentBlockTranslationRepository,
    expirationSettingRepository: IExpirationSettingRepository
  ) {
    this.pageRepository = pageRepository;
    this.pageVersionRepository = pageVersionRepository;
    this.pageVersionTranslationRepository = pageVersionTranslationRepository;
    this.contentBlockRepository = contentBlockRepository;
    this.contentBlockTranslationRepository = contentBlockTranslationRepository;
    this.expirationSettingRepository = expirationSettingRepository;
  }

  /**
   * Creates a new page with initial content and translations
   */
  async createPage(data: CreatePageRequest, context?: RequestContext): Promise<Page> {
    // 1. Create the page
    const page = await this.pageRepository.createPage(
      {
        teamId: data.teamId,
        slug: data.slug || null,
        status: 'draft',
      },
      context
    );

    // 2. Create the first version (version 1)
    const pageVersion = await this.pageVersionRepository.createPageVersion(
      {
        pageId: page.id,
        versionNumber: 1,
        isPublished: false,
        publishedAt: null,
        publishFrom: data.publishFrom || null,
        expirationId: data.expirationId || null,
      },
      context
    );

    // 3. Create translations for each language provided
    if (
      data.initialTitleTranslations ||
      data.initialMetaDescriptionTranslations ||
      data.initialMetaKeywordsTranslations ||
      data.initialSocialShareTitleTranslations ||
      data.initialSocialShareDescriptionTranslations
    ) {
      // Collect all language codes from all translation objects
      const languageCodes = new Set<string>();

      [
        data.initialTitleTranslations,
        data.initialMetaDescriptionTranslations,
        data.initialMetaKeywordsTranslations,
        data.initialSocialShareTitleTranslations,
        data.initialSocialShareDescriptionTranslations,
      ].forEach(translationMap => {
        if (translationMap) {
          Object.keys(translationMap).forEach(lang => languageCodes.add(lang));
        }
      });

      // Create translations for each language
      for (const languageCode of languageCodes) {
        await this.pageVersionTranslationRepository.createPageVersionTranslation(
          {
            versionId: pageVersion.id,
            languageCode,
            socialShareTitle: data.initialSocialShareTitleTranslations?.[languageCode] || null,
            socialShareDescription:
              data.initialSocialShareDescriptionTranslations?.[languageCode] || null,
            metaDescription: data.initialMetaDescriptionTranslations?.[languageCode] || null,
            metaKeywords: data.initialMetaKeywordsTranslations?.[languageCode] || null,
          },
          context
        );
      }
    }

    // 4. Create content blocks
    if (data.initialContentStructure && data.initialContentStructure.length > 0) {
      for (const blockData of data.initialContentStructure) {
        const contentBlock = await this.contentBlockRepository.createContentBlock(
          {
            versionId: pageVersion.id,
            blockType: blockData.blockType,
            order: blockData.order,
            content: blockData.content || null,
            settings: blockData.settings || null,
            displayState: 'live',
          },
          context
        );

        // Create translations for this content block if provided
        if (blockData.translations) {
          for (const [languageCode, translation] of Object.entries(blockData.translations)) {
            await this.contentBlockTranslationRepository.createContentBlockTranslation(
              {
                contentBlockId: contentBlock.id,
                languageCode,
                content: translation.content || null,
                settings: translation.settings || null,
              },
              context
            );
          }
        }
      }
    }

    return page;
  }

  /**
   * Gets a page by its ID
   */
  async getPageById(id: number): Promise<Page | null> {
    return this.pageRepository.getPageById(id);
  }

  /**
   * Gets a page by its slug
   */
  async getPageBySlug(slug: string): Promise<Page | null> {
    return this.pageRepository.getPageBySlug(slug);
  }

  /**
   * Gets a page along with its published version, content blocks, and translations
   */
  async getPageWithVersionDetails(
    pageId: number | string,
    languageCode: string
  ): Promise<PageWithVersion | null> {
    const id = typeof pageId === 'string' ? parseInt(pageId, 10) : pageId;

    // 1. Get the page
    const page = await this.pageRepository.getPageById(id);
    if (!page) {
      return null;
    }

    // 2. Get the published version
    const version = await this.pageVersionRepository.getPublishedPageVersion(page.id);
    if (!version) {
      return null;
    }

    // 3. Get translations for the version
    const translations =
      await this.pageVersionTranslationRepository.getPageVersionTranslationsByVersionId(version.id);

    // 4. Get content blocks for this version (only live ones)
    const contentBlocks = await this.contentBlockRepository.getContentBlocksByVersionId(
      version.id,
      true // onlyLive = true
    );

    // 5. Get translations for all content blocks
    const contentBlockIds = contentBlocks.map(block => block.id);
    const contentBlockTranslations =
      await this.contentBlockTranslationRepository.getContentBlockTranslationsByContentBlockIds(
        contentBlockIds
      );

    // 6. Get expiration settings if applicable
    let expiration: ExpirationSetting | undefined = undefined;
    if (version.expirationId) {
      const expirationSetting = await this.expirationSettingRepository.getExpirationSettingById(
        version.expirationId
      );
      if (expirationSetting) {
        expiration = expirationSetting;
      }
    }

    return {
      ...page,
      currentVersion: version,
      translations,
      contentBlocks,
      contentBlockTranslations,
      expiration,
    };
  }

  /**
   * Gets a page by its slug along with its published version, content blocks, and translations
   */
  async getPageBySlugWithVersionDetails(
    slug: string,
    languageCode: string
  ): Promise<PageWithVersion | null> {
    // 1. Get the page by slug
    const page = await this.pageRepository.getPageBySlug(slug);
    if (!page) {
      return null;
    }

    // 2. Use the existing method to get all details
    return this.getPageWithVersionDetails(page.id, languageCode);
  }

  /**
   * Saves changes to a page as a new draft version
   */
  async savePageDraft(data: SavePageDraftRequest, context?: RequestContext): Promise<PageVersion> {
    // 1. Get the page
    const page = await this.pageRepository.getPageById(data.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    // 2. Determine if we're updating an existing draft or creating a new version
    let pageVersion: PageVersion;

    if (data.versionId) {
      // Get existing version
      const existingVersion = await this.pageVersionRepository.getPageVersionById(data.versionId);
      if (!existingVersion) {
        throw new Error('Version not found');
      }

      // We can only update non-published versions
      if (existingVersion.isPublished) {
        throw new Error('Cannot modify a published version. Create a new draft instead.');
      }

      // Update the existing version
      pageVersion = existingVersion;

      // Update the version with expiration and publish from if provided
      if (data.expirationId !== undefined || data.publishFrom !== undefined) {
        await this.pageVersionRepository.updatePageVersion(
          pageVersion.id,
          {
            expirationId: data.expirationId,
            publishFrom: data.publishFrom,
          },
          context
        );
      }
    } else {
      // Get the latest version
      const latestVersion = await this.pageVersionRepository.getLatestPageVersion(data.pageId);
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      // Create a new version
      pageVersion = await this.pageVersionRepository.createPageVersion(
        {
          pageId: data.pageId,
          versionNumber: nextVersionNumber,
          isPublished: false,
          publishedAt: null,
          publishFrom: data.publishFrom || null,
          expirationId: data.expirationId || null,
        },
        context
      );
    }

    // 3. Update or create translations
    if (
      data.titleTranslations ||
      data.metaDescriptionTranslations ||
      data.metaKeywordsTranslations ||
      data.socialShareTitleTranslations ||
      data.socialShareDescriptionTranslations
    ) {
      // Collect all language codes
      const languageCodes = new Set<string>();

      [
        data.titleTranslations,
        data.metaDescriptionTranslations,
        data.metaKeywordsTranslations,
        data.socialShareTitleTranslations,
        data.socialShareDescriptionTranslations,
      ].forEach(translationMap => {
        if (translationMap) {
          Object.keys(translationMap).forEach(lang => languageCodes.add(lang));
        }
      });

      // Get existing translations for this version
      const existingTranslations =
        await this.pageVersionTranslationRepository.getPageVersionTranslationsByVersionId(
          pageVersion.id
        );

      // Create or update translations for each language
      for (const languageCode of languageCodes) {
        const translationData: Partial<PageVersionTranslation> = {};

        if (data.socialShareTitleTranslations?.[languageCode] !== undefined) {
          translationData.socialShareTitle = data.socialShareTitleTranslations[languageCode];
        }

        if (data.socialShareDescriptionTranslations?.[languageCode] !== undefined) {
          translationData.socialShareDescription =
            data.socialShareDescriptionTranslations[languageCode];
        }

        if (data.metaDescriptionTranslations?.[languageCode] !== undefined) {
          translationData.metaDescription = data.metaDescriptionTranslations[languageCode];
        }

        if (data.metaKeywordsTranslations?.[languageCode] !== undefined) {
          translationData.metaKeywords = data.metaKeywordsTranslations[languageCode];
        }

        // If the translation exists, update it
        if (existingTranslations[languageCode]) {
          await this.pageVersionTranslationRepository.updatePageVersionTranslation(
            existingTranslations[languageCode].id,
            translationData,
            context
          );
        } else {
          // Create a new translation
          await this.pageVersionTranslationRepository.createPageVersionTranslation(
            {
              versionId: pageVersion.id,
              languageCode,
              socialShareTitle: translationData.socialShareTitle || null,
              socialShareDescription: translationData.socialShareDescription || null,
              metaDescription: translationData.metaDescription || null,
              metaKeywords: translationData.metaKeywords || null,
            },
            context
          );
        }
      }
    }

    // 4. Handle content blocks
    if (data.contentBlocksData && data.contentBlocksData.length > 0) {
      // Get existing content blocks for this version
      const existingBlocks = await this.contentBlockRepository.getContentBlocksByVersionId(
        pageVersion.id
      );

      // Create a map for quick lookup
      const existingBlocksMap = new Map<number, ContentBlock>();
      existingBlocks.forEach(block => {
        if (block.id) {
          existingBlocksMap.set(block.id, block);
        }
      });

      // Process each content block
      for (const blockData of data.contentBlocksData) {
        let contentBlock: ContentBlock;

        if (blockData.id && existingBlocksMap.has(blockData.id)) {
          // Update existing block
          contentBlock = (await this.contentBlockRepository.updateContentBlock(
            blockData.id,
            {
              order: blockData.order,
              content: blockData.content,
              settings: blockData.settings,
              displayState: blockData.displayState,
            },
            context
          )) as ContentBlock;
        } else {
          // Create new block
          contentBlock = await this.contentBlockRepository.createContentBlock(
            {
              versionId: pageVersion.id,
              blockType: blockData.blockType,
              order: blockData.order,
              content: blockData.content || null,
              settings: blockData.settings || null,
              displayState: blockData.displayState || 'live',
            },
            context
          );
        }

        // Handle translations for this block
        if (blockData.translations) {
          // Get existing translations
          const existingTranslations = contentBlock.id
            ? await this.contentBlockTranslationRepository.getContentBlockTranslationsByContentBlockIds(
                [contentBlock.id]
              )
            : {};

          const blockTranslations = contentBlock.id
            ? existingTranslations[contentBlock.id] || {}
            : {};

          // Process each translation
          for (const [languageCode, translationData] of Object.entries(blockData.translations)) {
            const existingTranslation = blockTranslations[languageCode];

            if (existingTranslation && translationData.id === existingTranslation.id) {
              // Update existing translation
              await this.contentBlockTranslationRepository.updateContentBlockTranslation(
                existingTranslation.id,
                {
                  content: translationData.content,
                  settings: translationData.settings,
                },
                context
              );
            } else {
              // Create new translation
              await this.contentBlockTranslationRepository.createContentBlockTranslation(
                {
                  contentBlockId: contentBlock.id,
                  languageCode,
                  content: translationData.content || null,
                  settings: translationData.settings || null,
                },
                context
              );
            }
          }
        }
      }
    }

    return pageVersion;
  }

  /**
   * Publishes a page version
   */
  async publishPage(data: PublishPageRequest, context?: RequestContext): Promise<PageVersion> {
    // 1. Get the page
    const page = await this.pageRepository.getPageById(data.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    // 2. Get the version to publish
    const versionToPublish = await this.pageVersionRepository.getPageVersionById(data.versionId);
    if (!versionToPublish) {
      throw new Error('Version not found');
    }

    // 3. Unpublish all other versions
    await this.pageVersionRepository.unpublishAllVersionsExcept(
      data.pageId,
      data.versionId,
      context
    );

    // 4. Publish the specified version
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const publishedVersion = await this.pageVersionRepository.updatePageVersion(
      data.versionId,
      {
        isPublished: true,
        publishedAt: now,
      },
      context
    );

    // 5. Update the page status to "published"
    await this.pageRepository.updatePage(data.pageId, { status: 'published' }, context);

    return publishedVersion as PageVersion;
  }

  /**
   * Deletes a page and all associated data
   */
  async deletePage(id: number, context?: RequestContext): Promise<boolean> {
    // The database cascading deletes will handle most of the relationships
    // But we'll explicitly delete associated data to keep audit trails

    // 1. Get the page
    const page = await this.pageRepository.getPageById(id);
    if (!page) {
      throw new Error('Page not found');
    }

    // 2. Get all versions
    const latestVersion = await this.pageVersionRepository.getLatestPageVersion(id);
    if (latestVersion) {
      // 3. Delete all content blocks for each version
      // Note: This will cascade delete translations as well
      await this.contentBlockRepository.deleteContentBlocksByVersionId(latestVersion.id, context);

      // 4. Delete all version translations
      await this.pageVersionTranslationRepository.deletePageVersionTranslationsByVersionId(
        latestVersion.id,
        context
      );
    }

    // 5. Delete all versions
    await this.pageVersionRepository.deletePageVersionsByPageId(id, context);

    // 6. Delete the page itself
    return this.pageRepository.deletePage(id, context);
  }
}
