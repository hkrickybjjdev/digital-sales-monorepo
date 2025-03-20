import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError } from '../../../utils/apiResponse';
import { TeamCreatedWebhookSchema, TeamDeletedWebhookSchema } from '../models/webhookSchemas';
import { createPlanService, createSubscriptionService } from '../factory';

/**
 * Validate webhook signature
 *
 * This is a simple implementation. In production, you would:
 * 1. Use a more robust signature verification
 * 2. Use environment variables for secrets
 * 3. Have more comprehensive error handling
 */
async function validateWebhookSignature(
  c: Context<{ Bindings: Env }>,
  body: string
): Promise<boolean> {
  // Get signature from header
  const signature = c.req.header('X-Webhook-Signature');

  // If no signature, fail validation
  if (!signature) {
    return false;
  }

  // Get webhook secret from environment
  const secret = c.env.WEBHOOK_SECRET || 'dev-webhook-secret';

  // In a production environment, you would use a more robust signature verification
  // For simplicity in this example, we're using a basic string comparison
  // This should be replaced with a proper cryptographic comparison in production

  // Mock implementation for demonstration purposes
  const calculatedSignature = `sha256=${secret}-${body.slice(0, 10)}`;

  // Simple comparison - in production use a constant-time comparison
  return signature === calculatedSignature;
}

/**
 * Handle team created webhook from teams module
 *
 * - Provisions a free subscription plan for the new team
 */
export async function handleTeamCreated(c: Context<{ Bindings: Env }>) {
  try {
    // Get request body as text for signature verification
    const bodyText = await c.req.text();

    // Verify webhook signature (optional in dev, required in prod)
    if (c.env.ENVIRONMENT === 'production') {
      const isValid = await validateWebhookSignature(c, bodyText);
      if (!isValid) {
        return formatError(c, 'Invalid webhook signature', 'InvalidSignature', 401);
      }
    }

    // Parse and validate webhook payload
    const payload = TeamCreatedWebhookSchema.safeParse(JSON.parse(bodyText));

    if (!payload.success) {
      return formatError(c, 'Invalid webhook payload', 'ValidationError', 400);
    }

    const { team } = payload.data;

    // Find free plan
    const plans = await createPlanService(c.env).getPlans();
    const freePlan = plans.find(plan => plan.name.toLowerCase().includes('free'));

    if (freePlan) {
      // Create subscription with free plan
      await createSubscriptionService(c.env).createSubscription(team.userId, {
        teamId: team.id,
        planId: freePlan.id,
        interval: 'month', // Default interval for free plan
      });
    }

    return formatResponse(c, {
      message: 'Team successfully provisioned with subscription',
    });
  } catch (error) {
    console.error('Error handling team.created webhook:', error);
    return formatError(c, 'Error processing webhook', 'InternalServerError', 500);
  }
}

/**
 * Handle team deleted webhook from teams module
 *
 * - Cancels all subscriptions associated with the deleted team
 */
export async function handleTeamDeleted(c: Context<{ Bindings: Env }>) {
  try {
    // Get request body as text for signature verification
    const bodyText = await c.req.text();

    // Verify webhook signature (optional in dev, required in prod)
    if (c.env.ENVIRONMENT === 'production') {
      const isValid = await validateWebhookSignature(c, bodyText);
      if (!isValid) {
        return formatError(c, 'Invalid webhook signature', 'InvalidSignature', 401);
      }
    }

    // Parse and validate webhook payload
    const payload = TeamDeletedWebhookSchema.safeParse(JSON.parse(bodyText));

    if (!payload.success) {
      return formatError(c, 'Invalid webhook payload', 'ValidationError', 400);
    }

    const { team } = payload.data;

    // Get all subscriptions for the team
    const subscriptionService = createSubscriptionService(c.env);
    const subscriptions = await subscriptionService.getTeamSubscriptions(
      team.id,
      team.userId
    );

    // Cancel each subscription
    for (const subscription of subscriptions) {
      await subscriptionService.cancelSubscription(
        subscription.id,
        team.userId
      );
    }

    return formatResponse(c, {
      message: 'Team subscriptions successfully canceled',
    });
  } catch (error) {
    console.error('Error handling team.deleted webhook:', error);
    return formatError(c, 'Error processing webhook', 'InternalServerError', 500);
  }
}
