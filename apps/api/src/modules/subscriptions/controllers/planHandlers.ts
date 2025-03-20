import { Context } from 'hono';

import { Env } from '../../../types';
import { formatResponse, formatError, format500Error } from '../../../utils/apiResponse';
import { createPlanService } from '../factory';

/**
 * Get all available plans with their pricing options
 */
export const getPlans = async (c: Context<{ Bindings: Env }>) => {
  try {
    const planService = createPlanService(c.env);
    const plans = await planService.getPlans();

    return formatResponse(c, { plans });
  } catch (error) {
    console.error('Error getting plans:', error);
    return format500Error(error as Error);
  }
};

/**
 * Get a specific plan by ID with its pricing options
 */
export const getPlanById = async (c: Context<{ Bindings: Env }>) => {
  try {
    const planId = c.req.param('planId');

    const planService = createPlanService(c.env);
    const plan = await planService.getPlanById(planId);

    if (!plan) {
      return formatError(c, `Plan with id ${planId} not found`, 'ResourceNotFound', 404);
    }

    return formatResponse(c, { plan });
  } catch (error) {
    console.error('Error getting plan by id:', error);
    return format500Error(error as Error);
  }
};
