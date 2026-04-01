import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { SubscriptionService } from '../services/subscription.service';
import { StripeService } from '../services/stripe.service';
import { SubscriptionCheckoutDto } from '../dto/checkout.dto';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('billing')
@UseGuards(DatabaseReadyGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Get('subscription')
  async getSubscription(@User() user: PublicUserProfile) {
    const result = await this.subscriptionService.getUserSubscriptionWithPlan(user.id);
    if (!result) {
      return { subscription: null, plan: null };
    }
    return result;
  }

  @Post('subscription/checkout')
  async createCheckout(
    @Body() dto: SubscriptionCheckoutDto,
    @User() user: PublicUserProfile,
  ) {
    if (!this.stripeService.isConfigured()) {
      throw new HttpException('Payments not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const plan = await this.subscriptionService.getPlanById(dto.plan_id);
    if (!plan || !plan.stripe_price_id) {
      throw new HttpException('Plan not found or not purchasable', HttpStatus.BAD_REQUEST);
    }

    const customerId = await this.stripeService.getOrCreateCustomer(
      user.user_name,
      user.name,
      { userId: String(user.id) },
    );

    const checkoutUrl = await this.stripeService.createSubscriptionCheckout(
      customerId,
      plan.stripe_price_id,
      dto.success_url,
      dto.cancel_url,
      { userId: String(user.id), planId: String(plan.id) },
    );

    return { url: checkoutUrl };
  }

  @Post('subscription/cancel')
  async cancelSubscription(@User() user: PublicUserProfile) {
    const subscription = await this.subscriptionService.getUserSubscription(user.id);
    if (!subscription || !subscription.stripe_subscription_id) {
      throw new HttpException('No active subscription to cancel', HttpStatus.BAD_REQUEST);
    }

    await this.stripeService.cancelSubscription(subscription.stripe_subscription_id);
    await this.subscriptionService.cancelSubscription(user.id);

    return { message: 'Subscription will be canceled at end of billing period' };
  }
}
