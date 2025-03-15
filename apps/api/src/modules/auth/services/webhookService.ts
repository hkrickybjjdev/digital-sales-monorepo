import { Env } from '../../../types';

/**
 * Service responsible for triggering webhook events to other modules
 * when user-related events occur in the auth module.
 */
export class WebhookService {
  private env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }
  
  /**
   * Trigger a webhook event to the Teams module for user creation
   */
  async triggerUserCreated(user: {
    id: string;
    email: string;
    name: string;
    createdAt: number;
  }): Promise<void> {
    await this.sendWebhook('/api/v1/teams/webhooks/auth/user-created', {
      event: 'user.created',
      user
    });
  }
  
  /**
   * Trigger a webhook event to the Teams module for user updates
   */
  async triggerUserUpdated(user: {
    id: string;
    email: string;
    name: string;
    updatedAt: number;
  }, previous: {
    email?: string;
    name?: string;
  }): Promise<void> {
    await this.sendWebhook('/api/v1/teams/webhooks/auth/user-updated', {
      event: 'user.updated',
      user,
      previous
    });
  }
  
  /**
   * Trigger a webhook event to the Teams module for user deletion
   */
  async triggerUserDeleted(user: {
    id: string;
    deletedAt: number;
  }): Promise<void> {
    await this.sendWebhook('/api/v1/teams/webhooks/auth/user-deleted', {
      event: 'user.deleted',
      user
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
          'X-Webhook-Signature': signature
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error sending webhook to ${endpoint}: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`Failed to send webhook to ${endpoint}:`, error);
    }
  }
} 