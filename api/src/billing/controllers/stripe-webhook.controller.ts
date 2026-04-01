import {
  Controller,
  Post,
  Req,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../auth/public.decorator';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';
import { CreditService } from '../services/credit.service';
import Stripe from 'stripe';

@Controller('billing/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditService: CreditService,
  ) {}

  @Post('stripe')
  @Public()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.stripeService.isConfigured()) {
      throw new HttpException('Stripe not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    if (!req.rawBody) {
      throw new HttpException('Raw body not available', HttpStatus.BAD_REQUEST);
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId ? parseInt(session.metadata.userId, 10) : null;
    if (!userId) return;

    if (session.mode === 'subscription' && session.subscription) {
      const planId = session.metadata?.planId ? parseInt(session.metadata.planId, 10) : null;
      if (!planId) return;

      const subscription = await this.stripeService.getSubscription(
        session.subscription as string,
      );

      const plan = await this.subscriptionService.getPlanById(planId);
      if (!plan) return;

      const sub = subscription as any;
      const periodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : new Date();
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await this.subscriptionService.activateSubscription(
        userId,
        planId,
        session.customer as string,
        session.subscription as string,
        periodStart,
        periodEnd,
      );

      // Reset credits for the new plan
      await this.creditService.resetSubscriptionCredits(
        userId,
        plan.monthly_credits,
        plan.max_credit_rollover,
      );

      this.logger.log(`Activated subscription for user ${userId}, plan ${planId}`);
    } else if (session.mode === 'payment') {
      // Credit pack purchase
      const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0;
      const packId = session.metadata?.packId;

      if (credits > 0) {
        await this.creditService.addPurchasedCredits(
          userId,
          credits,
          `Credit pack purchase`,
          packId,
        );
        this.logger.log(`Added ${credits} purchased credits for user ${userId}`);
      }
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    // Recurring subscription payment - reset credits for new cycle
    const inv = invoice as any;
    if (inv.subscription && invoice.metadata?.userId) {
      const userId = parseInt(invoice.metadata.userId, 10);
      const result = await this.subscriptionService.getUserSubscriptionWithPlan(userId);
      if (result) {
        await this.creditService.resetSubscriptionCredits(
          userId,
          result.plan.monthly_credits,
          result.plan.max_credit_rollover,
        );
        this.logger.log(`Reset credits for user ${userId} on billing cycle renewal`);
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.metadata?.userId) {
      const userId = parseInt(invoice.metadata.userId, 10);
      await this.subscriptionService.setStatusPastDue(userId);
      this.logger.warn(`Payment failed for user ${userId}, set to past_due`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    if (subscription.metadata?.userId) {
      const userId = parseInt(subscription.metadata.userId, 10);
      await this.subscriptionService.revertToFree(userId);
      this.logger.log(`Subscription deleted for user ${userId}, reverted to Free`);
    }
  }
}
