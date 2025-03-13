import { Context } from 'hono';
import { SubscriptionService } from '../services/subscriptionService';
import { PlanRepository } from '../repositories/planRepository';
import { formatResponse, formatError, format500Error } from '../../../utils/api-response';
import { Env } from '../../../types';
import { 
  createSubscriptionSchema, 
  updateSubscriptionSchema 
} from '../models/schemas';


export const getSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      return formatError(c, 'Subscription not found', 'NotFound', 404);
    }

    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return format500Error(error as Error);
  }
}

export const getUserSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.getActiveSubscriptionByUser(userId);

    if (!subscription) {
      return formatError(c, 'Active subscription not found for this user', 'NotFound', 404);
    }

    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return format500Error(error as Error);
  }
}

export const createSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = createSubscriptionSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid subscription data: ' + result.error.message, 'ValidationError', 400);
    }
    
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.createSubscription(result.data);
    return formatResponse(c, { subscription }, 201);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return format500Error(error as Error);
  }
}

export const updateSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate the request body using Zod schema
    const result = updateSubscriptionSchema.safeParse(body);
    
    if (!result.success) {
      return formatError(c, 'Invalid subscription data: ' + result.error.message, 'ValidationError', 400);
    }
    
    if (Object.keys(result.data).length === 0) {
      return formatError(c, 'No update data provided', 'BadRequest', 400);
    }
    
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.updateSubscription(id, result.data);
    
    if (!subscription) {
      return formatError(c, 'Subscription not found', 'NotFound', 404);
    }
    
    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return format500Error(error as Error);
  }
}

export const cancelSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const id = c.req.param('id');
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.cancelSubscription(id);
    
    if (!subscription) {
      return formatError(c, 'Subscription not found or could not be canceled', 'NotFound', 404);
    }
    
    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return format500Error(error as Error);
  }
}

export const upgradeSubscription = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    if (!body.planId) {
      return formatError(c, 'Plan ID is required', 'BadRequest', 400);
    }
    
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.upgradeSubscription(
      userId, 
      body.planId, 
      body.paymentMethodId
    );
    
    if (!subscription) {
      return formatError(c, 'Failed to upgrade subscription', 'BadRequest', 400);
    }
    
    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return format500Error(error as Error);
  }
}

export const listUserSubscriptions = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscriptions = await subscriptionService.listUserSubscriptions(userId);
    
    return formatResponse(c, { subscriptions });
  } catch (error) {
    console.error('Error listing user subscriptions:', error);
    return format500Error(error as Error);
  }
}

export const listAvailablePlans = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Create a new instance of PlanRepository directly
    const planRepository = new PlanRepository(c.env.DB);
    const plans = await planRepository.listVisiblePlans();
    
    return formatResponse(c, { plans });
  } catch (error) {
    console.error('Error listing available plans:', error);
    return format500Error(error as Error);
  }
}

export const assignFreePlan = async (c: Context<{ Bindings: Env }>) => {
  try {
    const userId = c.req.param('userId');
    const subscriptionService = new SubscriptionService(c.env.DB);
    const subscription = await subscriptionService.assignFreePlanToUser(userId);
    
    if (!subscription) {
      return formatError(c, 'Failed to assign free plan', 'BadRequest', 400);
    }
    
    return formatResponse(c, { subscription });
  } catch (error) {
    console.error('Error assigning free plan:', error);
    return format500Error(error as Error);
  }
}
