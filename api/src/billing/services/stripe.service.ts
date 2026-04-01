import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-01-27.acacia' as any });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set - Stripe features disabled');
    }
  }

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  /**
   * Create or retrieve a Stripe customer for a user.
   */
  async getOrCreateCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const stripe = this.ensureStripe();

    // Check if customer already exists
    const existing = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      return existing.data[0].id;
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer.id;
  }

  /**
   * Create a Stripe Checkout session for a subscription plan.
   */
  async createSubscriptionCheckout(
    customerId: string,
    stripePriceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const stripe = this.ensureStripe();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return session.url!;
  }

  /**
   * Create a Stripe Checkout session for a one-time credit pack purchase.
   */
  async createCreditPackCheckout(
    customerId: string,
    stripePriceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const stripe = this.ensureStripe();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return session.url!;
  }

  /**
   * Cancel a Stripe subscription (at period end).
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    const stripe = this.ensureStripe();
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Immediately cancel a Stripe subscription.
   */
  async cancelSubscriptionImmediately(stripeSubscriptionId: string): Promise<void> {
    const stripe = this.ensureStripe();
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  }

  /**
   * Verify and construct a Stripe webhook event.
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const stripe = this.ensureStripe();
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Retrieve a Stripe subscription.
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = this.ensureStripe();
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }
}
