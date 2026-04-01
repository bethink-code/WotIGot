import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubscriptionPlan, PlanTier } from '../entities/subscription-plan.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { CreditBalance } from '../entities/credit-balance.entity';
import {
  SUBSCRIPTION_PLAN_REPOSITORY,
  USER_SUBSCRIPTION_REPOSITORY,
  CREDIT_BALANCE_REPOSITORY,
} from '../../database/repository-tokens';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @Inject(USER_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepo: Repository<UserSubscription>,
    @Inject(CREDIT_BALANCE_REPOSITORY)
    private readonly creditBalanceRepo: Repository<CreditBalance>,
  ) {}

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { is_active: true },
      order: { price_zar: 'ASC' },
    });
  }

  async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlan | null> {
    return this.planRepo.findOne({ where: { tier } });
  }

  async getPlanById(id: number): Promise<SubscriptionPlan | null> {
    return this.planRepo.findOne({ where: { id } });
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    return this.subscriptionRepo.findOne({ where: { user_id: userId } });
  }

  async getUserSubscriptionWithPlan(userId: number): Promise<{
    subscription: UserSubscription;
    plan: SubscriptionPlan;
  } | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { user_id: userId },
    });
    if (!subscription) return null;

    const plan = await this.planRepo.findOne({
      where: { id: subscription.plan_id },
    });
    if (!plan) return null;

    return { subscription, plan };
  }

  /**
   * Create a Free subscription for a new user.
   */
  async createFreeSubscription(userId: number): Promise<UserSubscription> {
    const freePlan = await this.planRepo.findOne({ where: { tier: PlanTier.Free } });
    if (!freePlan) {
      throw new Error('Free plan not found');
    }

    const subscription = this.subscriptionRepo.create({
      user_id: userId,
      plan_id: freePlan.id,
      status: SubscriptionStatus.Active,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return this.subscriptionRepo.save(subscription);
  }

  /**
   * Update subscription after Stripe checkout completes.
   */
  async activateSubscription(
    userId: number,
    planId: number,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<UserSubscription> {
    let subscription = await this.subscriptionRepo.findOne({
      where: { user_id: userId },
    });

    if (subscription) {
      subscription.plan_id = planId;
      subscription.status = SubscriptionStatus.Active;
      subscription.stripe_customer_id = stripeCustomerId;
      subscription.stripe_subscription_id = stripeSubscriptionId;
      subscription.current_period_start = periodStart;
      subscription.current_period_end = periodEnd;
      subscription.canceled_at = null;
      subscription.updated_at = new Date();
    } else {
      subscription = this.subscriptionRepo.create({
        user_id: userId,
        plan_id: planId,
        status: SubscriptionStatus.Active,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      });
    }

    return this.subscriptionRepo.save(subscription);
  }

  /**
   * Cancel a subscription (takes effect at end of billing period).
   */
  async cancelSubscription(userId: number): Promise<void> {
    await this.subscriptionRepo.update(
      { user_id: userId },
      {
        status: SubscriptionStatus.Canceled,
        canceled_at: new Date(),
        updated_at: new Date(),
      },
    );
  }

  /**
   * Revert user to Free tier (after cancellation period ends or failed payments).
   */
  async revertToFree(userId: number): Promise<void> {
    const freePlan = await this.planRepo.findOne({ where: { tier: PlanTier.Free } });
    if (!freePlan) return;

    await this.subscriptionRepo.update(
      { user_id: userId },
      {
        plan_id: freePlan.id,
        status: SubscriptionStatus.Active,
        stripe_subscription_id: null,
        canceled_at: null,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      },
    );
  }

  /**
   * Set subscription status to past_due.
   */
  async setStatusPastDue(userId: number): Promise<void> {
    await this.subscriptionRepo.update(
      { user_id: userId },
      {
        status: SubscriptionStatus.PastDue,
        updated_at: new Date(),
      },
    );
  }

  /**
   * Admin: override a user's plan.
   */
  async adminOverridePlan(userId: number, planId: number): Promise<void> {
    await this.subscriptionRepo.update(
      { user_id: userId },
      {
        plan_id: planId,
        status: SubscriptionStatus.Active,
        updated_at: new Date(),
      },
    );
  }

  /**
   * Check if a user's plan allows a specific limit.
   * Returns -1 for unlimited.
   */
  async checkLimit(
    userId: number,
    limitType: 'max_properties' | 'max_rooms_per_property' | 'max_items',
  ): Promise<number> {
    const result = await this.getUserSubscriptionWithPlan(userId);
    if (!result) return 1; // Default to most restrictive
    return result.plan[limitType];
  }
}
