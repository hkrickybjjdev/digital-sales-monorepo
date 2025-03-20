import { Env } from '../../../types';

/**
 * Interface for Teams webhook service operations
 */
export interface ITeamsWebhookService {
  triggerTeamCreated(team: {
    id: string;
    name: string;
    userId: string; // Owner ID
    createdAt: number;
  }): Promise<void>;

  triggerTeamDeleted(team: {
    id: string;
    name: string;
    userId: string; // Owner/Deleter ID
    createdAt: number;
  }): Promise<void>;
}

/**
 * Service responsible for triggering webhook events from the teams module
 * to other modules like subscriptions.
 */
export class TeamsWebhookService implements ITeamsWebhookService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Trigger a webhook event to the Subscriptions module when a team is created
   */
  async triggerTeamCreated(team: {
    id: string;
    name: string;
    userId: string; // Owner ID
    createdAt: number;
  }): Promise<void> {
    await this.sendWebhook('/api/v1/subscriptions/webhooks/teams/team-created', {
      event: 'team.created',
      team,
    });
  }

  /**
   * Trigger a webhook event to the Subscriptions module when a team is deleted
   */
  async triggerTeamDeleted(team: {
    id: string;
    name: string;
    userId: string; // Owner/Deleter ID
    createdAt: number;
  }): Promise<void> {
    await this.sendWebhook('/api/v1/subscriptions/webhooks/teams/team-deleted', {
      event: 'team.deleted',
      team,
    });
  }

  /**
   * Send a webhook payload to the specified endpoint
   */
  private async sendWebhook(endpoint: string, payload: any): Promise<void> {
    try {
      // Get the base URL from the environment or use a default for local development
      const baseUrl = this.env.API_URL || 'http://localhost:8787';

      // Get the webhook secret from the environment
      const secret = this.env.WEBHOOK_SECRET || 'dev-webhook-secret';

      // Create a simple signature for the payload
      // In production, you'd want a more secure signature algorithm
      const signature = `sha256=${secret}-${JSON.stringify(payload).slice(0, 10)}`;

      // Send the webhook
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error sending webhook to ${endpoint}: ${response.status} ${response.statusText}`,
          errorText
        );
      }
    } catch (error) {
      console.error(`Failed to send webhook to ${endpoint}:`, error);
    }
  }
}
