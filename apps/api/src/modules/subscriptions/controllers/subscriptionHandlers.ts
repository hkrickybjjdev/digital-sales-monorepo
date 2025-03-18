import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { getSubscriptionsContainer } from '../di/container';
import { createSubscriptionSchema, updateSubscriptionSchema } from '../models/schemas';

/**
 * Create a new subscription for a team
 */
export const createSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const body = await c.req.json();

    // Validate the input
    const parseResult = createSubscriptionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const container = getSubscriptionsContainer(c.env);
    const subscription = await container.subscriptionService.createSubscription(
      userId,
      parseResult.data
    );

    return formatResponse(c, { subscription }, 201);
  } catch (error) {
    console.error('Error creating subscription:', error);

    // Handle specific errors with appropriate responses
    if ((error as Error).message === 'Plan not found') {
      return formatError(c, 'Plan not found', 'ResourceNotFound', 404);
    }

    if ((error as Error).message === 'Team already has an active subscription') {
      return formatError(c, 'Team already has an active subscription', 'ConflictError', 409);
    }

    if ((error as Error).message === 'User does not have access to this team') {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    return format500Error(error as Error);
  }
};

/**
 * Get all subscriptions for a team
 */
export const getTeamSubscriptions = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const teamId = c.req.param('teamId');

    const container = getSubscriptionsContainer(c.env);
    const subscriptions = await container.subscriptionService.getTeamSubscriptions(teamId, userId);

    const activeSubscription = subscriptions.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    return formatResponse(c, {
      subscriptions,
      active: activeSubscription || null,
    });
  } catch (error) {
    console.error('Error getting team subscriptions:', error);

    if ((error as Error).message === 'User does not have access to this team') {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    return format500Error(error as Error);
  }
};

/**
 * Get a specific subscription by ID
 */
export const getSubscriptionById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const subscriptionId = c.req.param('subscriptionId');

    const container = getSubscriptionsContainer(c.env);
    const subscription = await container.subscriptionService.getSubscriptionById(
      subscriptionId,
      userId
    );

    if (!subscription) {
      return formatError(
        c,
        `Subscription with id ${subscriptionId} not found`,
        'ResourceNotFound',
        404
      );
    }

    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error getting subscription by id:', error);

    if ((error as Error).message === 'User does not have access to this subscription') {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    return format500Error(error as Error);
  }
};

/**
 * Update a subscription
 */
export const updateSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const subscriptionId = c.req.param('subscriptionId');
    const body = await c.req.json();

    // Validate the input
    const parseResult = updateSubscriptionSchema.safeParse(body);
    if (!parseResult.success) {
      return formatError(c, 'Invalid input', 'ValidationError', 400);
    }

    const container = getSubscriptionsContainer(c.env);
    const subscription = await container.subscriptionService.updateSubscription(
      subscriptionId,
      userId,
      parseResult.data
    );

    if (!subscription) {
      return formatError(
        c,
        `Subscription with id ${subscriptionId} not found`,
        'ResourceNotFound',
        404
      );
    }

    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);

    // Handle specific errors
    if ((error as Error).message === 'New plan not found') {
      return formatError(c, 'New plan not found', 'ResourceNotFound', 404);
    }

    if ((error as Error).message === 'User does not have access to this subscription') {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    return format500Error(error as Error);
  }
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.get('jwtPayload').sub;
    const subscriptionId = c.req.param('subscriptionId');

    const container = getSubscriptionsContainer(c.env);
    const subscription = await container.subscriptionService.cancelSubscription(
      subscriptionId,
      userId
    );

    if (!subscription) {
      return formatError(
        c,
        `Subscription with id ${subscriptionId} not found`,
        'ResourceNotFound',
        404
      );
    }

    return formatResponse(c, {
      subscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);

    if ((error as Error).message === 'User does not have access to this subscription') {
      return formatError(c, 'Access denied', 'AccessDenied', 403);
    }

    return format500Error(error as Error);
  }
};
