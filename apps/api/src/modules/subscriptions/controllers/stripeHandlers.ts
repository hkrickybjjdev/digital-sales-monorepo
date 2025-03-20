import { Context } from 'hono';
import { z } from 'zod';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { createSubscriptionRepository, createStripeService } from '../factory';

// Schema for create checkout session request
const createCheckoutSessionSchema = z.object({
  teamId: z.string(),
  lookupKey: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

// Schema for create portal session request
const createPortalSessionSchema = z.object({
  sessionId: z.string(),
});

/**
 * Create a Stripe Checkout session for subscription
 */
export const createCheckoutSession = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();

    // Validate the input
    const parseResult = createCheckoutSessionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const { teamId, lookupKey } = parseResult.data;

    // Default URLs if not provided
    const baseUrl = c.env.APP_URL || 'http://localhost:8787';
    const successUrl =
      parseResult.data.successUrl ||
      `${baseUrl}/teams/${teamId}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      parseResult.data.cancelUrl || `${baseUrl}/teams/${teamId}/billing?canceled=true`;

    // Check if user has access to the team
    const subscriptionRepository = createSubscriptionRepository(c.env);
    const hasAccess = await subscriptionRepository.checkUserTeamAccess(teamId, userId);

    if (!hasAccess) {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    // Create checkout session
    const stripeService = createStripeService(c.env);
    const session = await stripeService.createCheckoutSession({
      teamId,
      lookupKey,
      successUrl,
      cancelUrl,
    });

    return formatResponse(c, { url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    if ((error as Error).message.includes('lookup key')) {
      return formatError(c, (error as Error).message, 'ResourceNotFound', 404);
    }

    return format500Error(error as Error);
  }
};

/**
 * Create a Stripe Portal session for managing subscription
 */
export const createPortalSession = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();

    // Validate the input
    const parseResult = createPortalSessionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const { sessionId } = parseResult.data;

    // Get services
    const stripeService = createStripeService(c.env);
    const subscriptionRepository = createSubscriptionRepository(c.env);

    // Retrieve the checkout session to get customer ID
    const checkoutSession = await stripeService.retrieveCheckoutSession(sessionId);

    if (!checkoutSession.customer) {
      return formatError(c, 'No customer found for this session', 'ResourceNotFound', 404);
    }

    // Get the team ID from the session
    const teamId =
      checkoutSession.client_reference_id || (checkoutSession.metadata?.teamId as string);

    if (!teamId) {
      return formatError(c, 'No team ID found for this session', 'ResourceNotFound', 404);
    }

    // Check if user has access to the team
    const hasAccess = await subscriptionRepository.checkUserTeamAccess(teamId, userId);

    if (!hasAccess) {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    // Default return URL
    const baseUrl = c.env.APP_URL || 'http://localhost:8787';
    const returnUrl = `${baseUrl}/teams/${teamId}/billing`;

    // Create portal session
    const portalSession = await stripeService.createPortalSession({
      customerId: checkoutSession.customer as string,
      returnUrl,
    });

    return formatResponse(c, { url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);

    if ((error as Error).message.includes('No such checkout.session')) {
      return formatError(c, 'Session not found', 'ResourceNotFound', 404);
    }

    return format500Error(error as Error);
  }
};
