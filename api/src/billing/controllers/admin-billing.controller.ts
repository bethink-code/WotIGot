import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { SubscriptionService } from '../services/subscription.service';
import { CreditService } from '../services/credit.service';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { AdminCreditAdjustDto, AdminPlanOverrideDto } from '../dto/checkout.dto';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('billing/admin')
@UseGuards(DatabaseReadyGuard, SuperAdminGuard)
export class AdminBillingController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly creditService: CreditService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('overview')
  async getOverview() {
    return this.usageTrackingService.getAdminOverview();
  }

  @Get('users/:id/billing')
  async getUserBilling(@Param('id', ParseIntPipe) userId: number) {
    const subscription = await this.subscriptionService.getUserSubscriptionWithPlan(userId);
    const balance = await this.creditService.getBalance(userId);
    const recentUsage = await this.creditService.getUsageHistory(userId, 1, 10);
    const recentTransactions = await this.creditService.getTransactions(userId, 1, 10);

    return {
      subscription: subscription?.subscription ?? null,
      plan: subscription?.plan ?? null,
      balance: balance
        ? {
            ...balance,
            total: balance.subscription_credits + balance.purchased_credits + balance.rollover_credits,
          }
        : null,
      recent_usage: recentUsage,
      recent_transactions: recentTransactions,
    };
  }

  @Post('users/:id/credits')
  async adjustCredits(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: AdminCreditAdjustDto,
  ) {
    await this.creditService.adminAdjustCredits(userId, dto.amount, dto.description);
    const balance = await this.creditService.getBalance(userId);
    return {
      message: `Credits adjusted by ${dto.amount}`,
      balance,
    };
  }

  @Put('users/:id/plan')
  async overridePlan(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: AdminPlanOverrideDto,
  ) {
    const plan = await this.subscriptionService.getPlanById(dto.plan_id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.BAD_REQUEST);
    }

    await this.subscriptionService.adminOverridePlan(userId, dto.plan_id);

    // Reset credits to new plan's allocation
    await this.creditService.resetSubscriptionCredits(
      userId,
      plan.monthly_credits,
      plan.max_credit_rollover,
    );

    return { message: `User ${userId} plan overridden to ${plan.name}` };
  }

  @Post('users/:id/cancel')
  async cancelSubscription(@Param('id', ParseIntPipe) userId: number) {
    await this.subscriptionService.cancelSubscription(userId);
    return { message: `Subscription canceled for user ${userId}` };
  }
}
