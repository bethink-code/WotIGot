import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { CreditBalance } from '../entities/credit-balance.entity';
import { CreditTransaction, TransactionType } from '../entities/credit-transaction.entity';
import { UsageLog, UsageActionType, CreditSourceType } from '../entities/usage-log.entity';
import { LazyDatabaseService } from '../../database/lazy-database.service';
import {
  CREDIT_BALANCE_REPOSITORY,
  CREDIT_TRANSACTION_REPOSITORY,
  USAGE_LOG_REPOSITORY,
} from '../../database/repository-tokens';

export interface DeductionResult {
  success: boolean;
  available: number;
  remaining: number;
  deductionId: number | null;
}

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(
    @Inject(CREDIT_BALANCE_REPOSITORY)
    private readonly creditBalanceRepo: Repository<CreditBalance>,
    @Inject(CREDIT_TRANSACTION_REPOSITORY)
    private readonly creditTransactionRepo: Repository<CreditTransaction>,
    @Inject(USAGE_LOG_REPOSITORY)
    private readonly usageLogRepo: Repository<UsageLog>,
    private readonly lazyDb: LazyDatabaseService,
  ) {}

  async getBalance(userId: number): Promise<CreditBalance | null> {
    return this.creditBalanceRepo.findOne({ where: { user_id: userId } });
  }

  async getTotalCredits(userId: number): Promise<number> {
    const balance = await this.getBalance(userId);
    if (!balance) return 0;
    return balance.subscription_credits + balance.purchased_credits + balance.rollover_credits;
  }

  /**
   * Atomically attempt to deduct credits from a user's balance.
   * Uses SELECT ... FOR UPDATE to prevent race conditions.
   * Consumption priority: rollover -> subscription -> purchased.
   */
  async attemptDeduction(
    userId: number,
    cost: number,
    actionType: UsageActionType,
    metadata?: Record<string, any>,
  ): Promise<DeductionResult> {
    const ds = await this.lazyDb.getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the row for this user
      const rows = await queryRunner.query(
        `SELECT * FROM "credit_balance" WHERE "user_id" = $1 FOR UPDATE`,
        [userId],
      );

      if (rows.length === 0) {
        await queryRunner.rollbackTransaction();
        return { success: false, available: 0, remaining: 0, deductionId: null };
      }

      const balance = rows[0];
      const total = balance.subscription_credits + balance.purchased_credits + balance.rollover_credits;

      if (total < cost) {
        await queryRunner.rollbackTransaction();
        return { success: false, available: total, remaining: total, deductionId: null };
      }

      // Deduct in priority order: rollover -> subscription -> purchased
      let remaining = cost;
      let rolloverUsed = 0;
      let subscriptionUsed = 0;
      let purchasedUsed = 0;
      let creditSource: CreditSourceType = CreditSourceType.Subscription;

      // 1. Rollover credits first
      if (remaining > 0 && balance.rollover_credits > 0) {
        rolloverUsed = Math.min(remaining, balance.rollover_credits);
        remaining -= rolloverUsed;
        creditSource = CreditSourceType.Rollover;
      }

      // 2. Subscription credits
      if (remaining > 0 && balance.subscription_credits > 0) {
        subscriptionUsed = Math.min(remaining, balance.subscription_credits);
        remaining -= subscriptionUsed;
        creditSource = CreditSourceType.Subscription;
      }

      // 3. Purchased credits
      if (remaining > 0 && balance.purchased_credits > 0) {
        purchasedUsed = Math.min(remaining, balance.purchased_credits);
        remaining -= purchasedUsed;
        creditSource = CreditSourceType.Purchased;
      }

      const newRollover = balance.rollover_credits - rolloverUsed;
      const newSubscription = balance.subscription_credits - subscriptionUsed;
      const newPurchased = balance.purchased_credits - purchasedUsed;
      const newTotal = newRollover + newSubscription + newPurchased;
      const newLifetimeUsed = balance.lifetime_credits_used + cost;

      // Update balance
      await queryRunner.query(
        `UPDATE "credit_balance"
         SET "rollover_credits" = $1,
             "subscription_credits" = $2,
             "purchased_credits" = $3,
             "lifetime_credits_used" = $4,
             "updated_at" = now()
         WHERE "user_id" = $5`,
        [newRollover, newSubscription, newPurchased, newLifetimeUsed, userId],
      );

      // Insert usage log
      const usageResult = await queryRunner.query(
        `INSERT INTO "usage_log" ("user_id", "action_type", "credits_used", "credit_source", "balance_after", "metadata")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, actionType, cost, creditSource, newTotal, metadata ? JSON.stringify(metadata) : null],
      );
      const usageLogId = usageResult[0].id;

      // Insert credit transaction
      await queryRunner.query(
        `INSERT INTO "credit_transaction" ("user_id", "type", "amount", "balance_after", "description", "reference_id")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, TransactionType.Usage, -cost, newTotal, `AI ${actionType}`, String(usageLogId)],
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        available: total,
        remaining: newTotal,
        deductionId: usageLogId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Credit deduction failed for user ${userId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Refund a credit deduction (e.g., when an AI call fails after deduction).
   */
  async refundDeduction(deductionId: number): Promise<void> {
    const ds = await this.lazyDb.getDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const usageLogs = await queryRunner.query(
        `SELECT * FROM "usage_log" WHERE "id" = $1 AND "refunded" = false FOR UPDATE`,
        [deductionId],
      );

      if (usageLogs.length === 0) {
        await queryRunner.rollbackTransaction();
        return;
      }

      const usageLog = usageLogs[0];
      const { user_id, credits_used, credit_source } = usageLog;

      // Restore credits to the original source
      const sourceColumn = credit_source === 'rollover'
        ? 'rollover_credits'
        : credit_source === 'purchased'
          ? 'purchased_credits'
          : 'subscription_credits';

      await queryRunner.query(
        `UPDATE "credit_balance"
         SET "${sourceColumn}" = "${sourceColumn}" + $1,
             "lifetime_credits_used" = "lifetime_credits_used" - $1,
             "updated_at" = now()
         WHERE "user_id" = $2`,
        [credits_used, user_id],
      );

      // Mark usage log as refunded
      await queryRunner.query(
        `UPDATE "usage_log" SET "refunded" = true WHERE "id" = $1`,
        [deductionId],
      );

      // Get new balance for transaction log
      const balanceRows = await queryRunner.query(
        `SELECT subscription_credits + purchased_credits + rollover_credits as total FROM "credit_balance" WHERE "user_id" = $1`,
        [user_id],
      );
      const newTotal = balanceRows[0]?.total ?? 0;

      // Log the refund transaction
      await queryRunner.query(
        `INSERT INTO "credit_transaction" ("user_id", "type", "amount", "balance_after", "description", "reference_id")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, TransactionType.Refund, credits_used, newTotal, 'AI call failed - credits refunded', String(deductionId)],
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Refunded ${credits_used} credits for user ${user_id} (usage log ${deductionId})`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Credit refund failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add purchased credits from a credit pack purchase.
   */
  async addPurchasedCredits(
    userId: number,
    credits: number,
    description: string,
    referenceId?: string,
  ): Promise<void> {
    await this.creditBalanceRepo
      .createQueryBuilder()
      .update()
      .set({
        purchased_credits: () => `purchased_credits + ${credits}`,
        lifetime_credits_purchased: () => `lifetime_credits_purchased + ${credits}`,
        updated_at: new Date(),
      })
      .where('user_id = :userId', { userId })
      .execute();

    const balance = await this.getBalance(userId);
    const total = balance
      ? balance.subscription_credits + balance.purchased_credits + balance.rollover_credits
      : credits;

    await this.creditTransactionRepo.save({
      user_id: userId,
      type: TransactionType.PackPurchase,
      amount: credits,
      balance_after: total,
      description,
      reference_id: referenceId,
    });
  }

  /**
   * Admin: manually adjust credits.
   */
  async adminAdjustCredits(
    userId: number,
    amount: number,
    description: string,
  ): Promise<void> {
    if (amount > 0) {
      await this.creditBalanceRepo
        .createQueryBuilder()
        .update()
        .set({
          purchased_credits: () => `purchased_credits + ${amount}`,
          updated_at: new Date(),
        })
        .where('user_id = :userId', { userId })
        .execute();
    } else {
      // Deduct from subscription_credits first
      const balance = await this.getBalance(userId);
      if (!balance) return;
      const deductAmount = Math.abs(amount);
      const fromSubscription = Math.min(deductAmount, balance.subscription_credits);
      const fromPurchased = deductAmount - fromSubscription;

      await this.creditBalanceRepo
        .createQueryBuilder()
        .update()
        .set({
          subscription_credits: () => `subscription_credits - ${fromSubscription}`,
          purchased_credits: () => `purchased_credits - ${fromPurchased}`,
          updated_at: new Date(),
        })
        .where('user_id = :userId', { userId })
        .execute();
    }

    const balance = await this.getBalance(userId);
    const total = balance
      ? balance.subscription_credits + balance.purchased_credits + balance.rollover_credits
      : 0;

    await this.creditTransactionRepo.save({
      user_id: userId,
      type: TransactionType.AdminAdjustment,
      amount,
      balance_after: total,
      description,
    });
  }

  /**
   * Reset subscription credits for a new billing cycle.
   */
  async resetSubscriptionCredits(
    userId: number,
    newCredits: number,
    maxRollover: number,
  ): Promise<void> {
    const balance = await this.getBalance(userId);
    if (!balance) return;

    const unusedSubscription = balance.subscription_credits;
    const rollover = Math.min(unusedSubscription, maxRollover);

    // Expire old subscription credits
    if (unusedSubscription > 0) {
      const expired = unusedSubscription - rollover;
      if (expired > 0) {
        const total = balance.rollover_credits + balance.purchased_credits + rollover + newCredits;
        await this.creditTransactionRepo.save({
          user_id: userId,
          type: TransactionType.Expiry,
          amount: -expired,
          balance_after: total,
          description: `${expired} unused subscription credits expired`,
        });
      }
    }

    // Set new credits
    await this.creditBalanceRepo
      .createQueryBuilder()
      .update()
      .set({
        subscription_credits: newCredits,
        rollover_credits: rollover,
        updated_at: new Date(),
      })
      .where('user_id = :userId', { userId })
      .execute();

    const newBalance = await this.getBalance(userId);
    const newTotal = newBalance
      ? newBalance.subscription_credits + newBalance.purchased_credits + newBalance.rollover_credits
      : 0;

    // Log allocation
    await this.creditTransactionRepo.save({
      user_id: userId,
      type: TransactionType.SubscriptionAllocation,
      amount: newCredits,
      balance_after: newTotal,
      description: `Monthly allocation: ${newCredits} credits`,
    });

    if (rollover > 0) {
      await this.creditTransactionRepo.save({
        user_id: userId,
        type: TransactionType.Rollover,
        amount: rollover,
        balance_after: newTotal,
        description: `${rollover} credits rolled over from previous cycle`,
      });
    }
  }

  /**
   * Get paginated usage history for a user.
   */
  async getUsageHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: UsageLog[]; total: number }> {
    const [items, total] = await this.usageLogRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  /**
   * Get credit transactions (bank statement) for a user.
   */
  async getTransactions(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: CreditTransaction[]; total: number }> {
    const [items, total] = await this.creditTransactionRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  /**
   * Create initial credit balance for a new user.
   */
  async createInitialBalance(userId: number, initialCredits: number): Promise<void> {
    await this.creditBalanceRepo.save({
      user_id: userId,
      subscription_credits: initialCredits,
    });

    await this.creditTransactionRepo.save({
      user_id: userId,
      type: TransactionType.SubscriptionAllocation,
      amount: initialCredits,
      balance_after: initialCredits,
      description: 'Initial credit allocation',
    });
  }
}
