import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsageLog, UsageActionType } from '../entities/usage-log.entity';
import { USAGE_LOG_REPOSITORY } from '../../database/repository-tokens';

export interface UsageSummary {
  total_credits_used: number;
  total_actions: number;
  by_action_type: {
    action_type: UsageActionType;
    count: number;
    credits: number;
  }[];
}

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    @Inject(USAGE_LOG_REPOSITORY)
    private readonly usageLogRepo: Repository<UsageLog>,
  ) {}

  /**
   * Get usage summary for a user within a date range.
   */
  async getUsageSummary(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageSummary> {
    const qb = this.usageLogRepo
      .createQueryBuilder('u')
      .where('u.user_id = :userId', { userId })
      .andWhere('u.refunded = false');

    if (startDate) {
      qb.andWhere('u.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('u.created_at <= :endDate', { endDate });
    }

    const logs = await qb.getMany();

    const byType = new Map<UsageActionType, { count: number; credits: number }>();

    let totalCredits = 0;
    for (const log of logs) {
      totalCredits += log.credits_used;
      const existing = byType.get(log.action_type) || { count: 0, credits: 0 };
      existing.count++;
      existing.credits += log.credits_used;
      byType.set(log.action_type, existing);
    }

    return {
      total_credits_used: totalCredits,
      total_actions: logs.length,
      by_action_type: Array.from(byType.entries()).map(([action_type, data]) => ({
        action_type,
        ...data,
      })),
    };
  }

  /**
   * Get admin overview stats.
   */
  async getAdminOverview(): Promise<{
    today: number;
    this_week: number;
    this_month: number;
    total_users_with_usage: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayResult = await this.usageLogRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.credits_used), 0)', 'total')
      .where('u.created_at >= :start', { start: startOfDay })
      .andWhere('u.refunded = false')
      .getRawOne();

    const weekResult = await this.usageLogRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.credits_used), 0)', 'total')
      .where('u.created_at >= :start', { start: startOfWeek })
      .andWhere('u.refunded = false')
      .getRawOne();

    const monthResult = await this.usageLogRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.credits_used), 0)', 'total')
      .where('u.created_at >= :start', { start: startOfMonth })
      .andWhere('u.refunded = false')
      .getRawOne();

    const usersResult = await this.usageLogRepo
      .createQueryBuilder('u')
      .select('COUNT(DISTINCT u.user_id)', 'count')
      .where('u.refunded = false')
      .getRawOne();

    return {
      today: Number(todayResult?.total ?? 0),
      this_week: Number(weekResult?.total ?? 0),
      this_month: Number(monthResult?.total ?? 0),
      total_users_with_usage: Number(usersResult?.count ?? 0),
    };
  }
}
