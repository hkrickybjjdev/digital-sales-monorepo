import { DatabaseFactory } from '../../../database/databaseFactory';
import { DatabaseService, RequestContext } from '../../../database/databaseService';
import { Env } from '../../../types';
import { ContentBlock } from '../models/schemas';

import { IContentBlockRepository } from './interfaces';

export class ContentBlockRepository implements IContentBlockRepository {
  private dbService: DatabaseService;

  constructor(env: Env) {
    this.dbService = DatabaseFactory.getInstance(env);
  }

  async createContentBlock(
    contentBlock: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>,
    context?: RequestContext
  ): Promise<ContentBlock> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const result = await this.dbService.executeWithAudit(
      {
        sql: `
          INSERT INTO ContentBlock (
            versionId, 
            blockType, 
            order, 
            content, 
            settings, 
            createdAt, 
            updatedAt,
            displayState
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `,
        params: [
          contentBlock.versionId,
          contentBlock.blockType,
          contentBlock.order,
          contentBlock.content,
          contentBlock.settings,
          now,
          now,
          contentBlock.displayState || 'live',
        ],
      },
      {
        eventType: 'content_block_created',
        resourceType: 'ContentBlock',
        details: JSON.stringify({
          versionId: contentBlock.versionId,
          blockType: contentBlock.blockType,
          order: contentBlock.order,
        }),
        outcome: 'success',
      },
      context
    );

    // Safe type assertion as we know this query returns an object with an id
    const id = (result as any).id;

    return {
      id,
      versionId: contentBlock.versionId,
      blockType: contentBlock.blockType,
      order: contentBlock.order,
      content: contentBlock.content,
      settings: contentBlock.settings,
      createdAt: now,
      updatedAt: now,
      displayState: contentBlock.displayState || 'live',
    };
  }

  async getContentBlockById(id: number): Promise<ContentBlock | null> {
    const result = await this.dbService.queryOne<ContentBlock>({
      sql: `SELECT * FROM ContentBlock WHERE id = ?`,
      params: [id],
    });

    return result || null;
  }

  async getContentBlocksByVersionId(
    versionId: number,
    onlyLive: boolean = false
  ): Promise<ContentBlock[]> {
    let sql = `
      SELECT * FROM ContentBlock 
      WHERE versionId = ?
    `;

    const params: any[] = [versionId];

    if (onlyLive) {
      sql += ` AND displayState = 'live'`;
    }

    sql += ` ORDER BY "order" ASC`;

    const results = await this.dbService.queryMany<ContentBlock>({
      sql,
      params,
    });

    return results;
  }

  async updateContentBlock(
    id: number,
    contentBlock: Partial<ContentBlock>,
    context?: RequestContext
  ): Promise<ContentBlock | null> {
    const existingBlock = await this.getContentBlockById(id);
    if (!existingBlock) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (contentBlock.order !== undefined) {
      updates.push('"order" = ?');
      values.push(contentBlock.order);
    }

    if (contentBlock.content !== undefined) {
      updates.push('content = ?');
      values.push(contentBlock.content);
    }

    if (contentBlock.settings !== undefined) {
      updates.push('settings = ?');
      values.push(contentBlock.settings);
    }

    if (contentBlock.displayState !== undefined) {
      updates.push('displayState = ?');
      values.push(contentBlock.displayState);
    }

    if (updates.length === 0) {
      return existingBlock;
    }

    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.dbService.executeWithAudit(
      {
        sql: `
          UPDATE ContentBlock 
          SET ${updates.join(', ')}
          WHERE id = ?
        `,
        params: values,
      },
      {
        eventType: 'content_block_updated',
        resourceType: 'ContentBlock',
        resourceId: id.toString(),
        details: JSON.stringify(contentBlock),
        outcome: 'success',
      },
      context
    );

    return this.getContentBlockById(id);
  }

  async deleteContentBlock(id: number, context?: RequestContext): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM ContentBlock WHERE id = ?`,
        params: [id],
      },
      {
        eventType: 'content_block_deleted',
        resourceType: 'ContentBlock',
        resourceId: id.toString(),
        outcome: 'success',
      },
      context
    );

    return true;
  }

  async deleteContentBlocksByVersionId(
    versionId: number,
    context?: RequestContext
  ): Promise<boolean> {
    await this.dbService.executeWithAudit(
      {
        sql: `DELETE FROM ContentBlock WHERE versionId = ?`,
        params: [versionId],
      },
      {
        eventType: 'content_blocks_deleted',
        resourceType: 'ContentBlock',
        details: JSON.stringify({ versionId }),
        outcome: 'success',
      },
      context
    );

    return true;
  }
}
