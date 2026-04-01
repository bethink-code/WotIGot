import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { CreditService } from '../services/credit.service';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('billing')
@UseGuards(DatabaseReadyGuard)
export class UsageController {
  constructor(
    private readonly creditService: CreditService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('usage')
  async getUsageHistory(
    @User() user: PublicUserProfile,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.creditService.getUsageHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('usage/summary')
  async getUsageSummary(
    @User() user: PublicUserProfile,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.usageTrackingService.getUsageSummary(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
