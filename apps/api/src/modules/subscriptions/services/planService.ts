import { Plan, PlanWithPrices } from '../models/schemas';

import { IPlanRepository, IPlanService } from './interfaces';

export class PlanService implements IPlanService {
  constructor(private readonly planRepository: IPlanRepository) {}

  async getPlans(): Promise<PlanWithPrices[]> {
    try {
      // Get visible plans only
      const plans = await this.planRepository.getPlans(true);

      // For each plan, fetch its prices to create PlanWithPrices objects
      const plansWithPrices = await Promise.all(
        plans.map(async plan => {
          const prices = await this.planRepository.getPricesForPlan(plan.id);
          return {
            ...plan,
            prices,
          };
        })
      );

      return plansWithPrices;
    } catch (error) {
      console.error('Error fetching plans with prices:', error);
      return [];
    }
  }

  async getPlanById(id: string): Promise<PlanWithPrices | null> {
    try {
      // Get the plan
      const plan = await this.planRepository.getPlanById(id);
      if (!plan) return null;

      // Get the prices for this plan
      const prices = await this.planRepository.getPricesForPlan(id);

      // Return the plan with its prices
      return {
        ...plan,
        prices,
      };
    } catch (error) {
      console.error(`Error fetching plan with ID ${id}:`, error);
      return null;
    }
  }
}
