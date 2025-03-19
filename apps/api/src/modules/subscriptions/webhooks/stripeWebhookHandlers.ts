import { Context } from 'hono';
import Stripe from 'stripe';

import { Env } from '../../../types';
import { formatResponse, formatError } from '../../../utils/apiResponse';
import { getService } from '../di/container';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (c: Context<{ Bindings: Env }>) => {
  const env = c.env;

  // Get the signature from the header
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    console.log('⚠️ Webhook signature missing');
    return c.text('Webhook signature missing', 400);
  }

  let event: Stripe.Event;

  try {
    // Get the raw body as text
    const payload = await c.req.text();

    // Create a Stripe instance
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed: ${(err as Error).message}`);
    return c.text(`Webhook signature verification failed: ${(err as Error).message}`, 400);
  }

  let subscription: Stripe.Subscription;
  let session: Stripe.Checkout.Session;
  let teamId: string | undefined;

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        session = event.data.object as Stripe.Checkout.Session;
        teamId = session.client_reference_id || (session.metadata?.teamId as string);

        if (!teamId) {
          console.log('⚠️ No team ID found in checkout session');
          return c.text('No team ID found in checkout session', 400);
        }

        if (session.mode === 'subscription' && session.subscription) {
          // Store the subscription in our database
          await handleSubscriptionCreated(env, session.subscription as string, teamId);
        }
        break;

      case 'customer.subscription.created':
        subscription = event.data.object as Stripe.Subscription;
        // Extract team ID from metadata if available
        teamId = subscription.metadata?.teamId as string;

        if (teamId) {
          await handleSubscriptionCreated(env, subscription.id, teamId);
        } else {
          console.log('⚠️ No team ID found in subscription metadata');
        }
        break;

      case 'customer.subscription.updated':
        subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(env, subscription);
        break;

      case 'customer.subscription.deleted':
        subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(env, subscription);
        break;

      case 'customer.subscription.trial_will_end':
        subscription = event.data.object as Stripe.Subscription;
        // Handle trial ending notification if needed
        console.log(`Trial will end for subscription ${subscription.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.text('Webhook received', 200);
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return c.text(`Error processing webhook: ${(error as Error).message}`, 500);
  }
};

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(
  env: Env,
  subscriptionId: string,
  teamId: string
) {
  try {
    // Create a Stripe instance
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Fetch the subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    // Get the price and product details
    const item = stripeSubscription.items.data[0];
    const priceId = item.price.id;

    // Find the corresponding plan in our system
    const plans = await getService(env, 'planService').getPlans();
    const matchingPlan = plans.find((plan) => 
      plan.prices?.some((price) => price.id === priceId)
    );

    if (!matchingPlan) {
      console.error(`No matching plan found for Stripe price ${priceId}`);
      return;
    }

    const now = Date.now();

    // Create subscription record
    const subscription = {
      id: generateUUID(),
      teamId,
      planId: matchingPlan.id,
      startDate: now,
      endDate: stripeSubscription.cancel_at ? stripeSubscription.cancel_at * 1000 : null,
      status: stripeSubscription.status,
      paymentGateway: 'stripe',
      subscriptionId: stripeSubscription.id,
      createdAt: now,
      updatedAt: now,
      cancelAt: stripeSubscription.cancel_at ? stripeSubscription.cancel_at * 1000 : null,
    };

    // Save to database
    await getService(env, 'subscriptionRepository').createSubscription(subscription);

    console.log(`Subscription ${subscriptionId} created for team ${teamId}`);
  } catch (error) {
    console.error(`Error handling subscription created:`, error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(
  env: Env,
  stripeSubscription: Stripe.Subscription
) {
  try {
    // Find the subscription in our database
    const subscriptions = await getService(env, 'subscriptionRepository').findByStripeSubscriptionId(
      stripeSubscription.id
    );

    if (!subscriptions.length) {
      console.log(`No subscription found for Stripe subscription ${stripeSubscription.id}`);
      return;
    }

    // Update each subscription record
    for (const subscription of subscriptions) {
      const updateData = {
        status: stripeSubscription.status,
        endDate: stripeSubscription.cancel_at ? stripeSubscription.cancel_at * 1000 : null,
        cancelAt: stripeSubscription.cancel_at ? stripeSubscription.cancel_at * 1000 : null,
        updatedAt: Date.now(),
      };

      await getService(env, 'subscriptionRepository').updateSubscription(subscription.id, updateData);
    }

    console.log(`Subscription ${stripeSubscription.id} updated`);
  } catch (error) {
    console.error(`Error handling subscription updated:`, error);
    throw error;
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  env: Env,
  stripeSubscription: Stripe.Subscription
) {
  try {
    // Find the subscription in our database
    const subscriptions = await getService(env, 'subscriptionRepository').findByStripeSubscriptionId(
      stripeSubscription.id
    );

    if (!subscriptions.length) {
      console.log(`No subscription found for Stripe subscription ${stripeSubscription.id}`);
      return;
    }

    // Update each subscription record
    for (const subscription of subscriptions) {
      const updateData = {
        status: 'cancelled',
        endDate: Date.now(),
        cancelAt: Date.now(),
        updatedAt: Date.now(),
      };

      await getService(env, 'subscriptionRepository').updateSubscription(subscription.id, updateData);
    }

    console.log(`Subscription ${stripeSubscription.id} marked as cancelled`);
  } catch (error) {
    console.error(`Error handling subscription deleted:`, error);
    throw error;
  }
}

// Helper function to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}
