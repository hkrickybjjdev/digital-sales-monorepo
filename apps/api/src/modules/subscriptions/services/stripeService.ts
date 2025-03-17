import Stripe from 'stripe';

import { Env } from '../../../types';

export interface IStripeService {
  /**
   * Create a checkout session for subscription
   */
  createCheckoutSession(options: {
    teamId: string;
    lookupKey: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  /**
   * Create a billing portal session
   */
  createPortalSession(options: { customerId: string; returnUrl: string }): Promise<{ url: string }>;

  /**
   * Retrieve a checkout session
   */
  retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event;
}

export class StripeService implements IStripeService {
  private stripe: Stripe;
  private endpointSecret: string;

  constructor(env: Env) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    this.endpointSecret = env.STRIPE_WEBHOOK_SECRET;
  }

  async createCheckoutSession(options: {
    teamId: string;
    lookupKey: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    const { teamId, lookupKey, successUrl, cancelUrl } = options;

    // Get the price by lookup key
    const prices = await this.stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product'],
    });

    if (!prices.data.length) {
      throw new Error(`Price with lookup key ${lookupKey} not found`);
    }

    // Create the checkout session
    const session = await this.stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: teamId, // Store the team ID for reference
      metadata: {
        teamId, // Also store in metadata for webhook processing
      },
    });

    return { url: session.url! };
  }

  async createPortalSession(options: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const { customerId, returnUrl } = options;

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });
  }

  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, this.endpointSecret);
  }
}
