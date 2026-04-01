import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { CreditService } from '../services/credit.service';
import { StripeService } from '../services/stripe.service';
import { CreditPack } from '../entities/credit-pack.entity';
import { CreditPackCheckoutDto } from '../dto/checkout.dto';
import { CREDIT_PACK_REPOSITORY } from '../../database/repository-tokens';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('billing')
@UseGuards(DatabaseReadyGuard)
export class CreditsController {
  constructor(
    private readonly creditService: CreditService,
    private readonly stripeService: StripeService,
    @Inject(CREDIT_PACK_REPOSITORY)
    private readonly creditPackRepo: Repository<CreditPack>,
  ) {}

  @Get('credits')
  async getBalance(@User() user: PublicUserProfile) {
    const balance = await this.creditService.getBalance(user.id);
    if (!balance) {
      return {
        subscription_credits: 0,
        purchased_credits: 0,
        rollover_credits: 0,
        total: 0,
        lifetime_credits_purchased: 0,
        lifetime_credits_used: 0,
      };
    }
    return {
      ...balance,
      total: balance.subscription_credits + balance.purchased_credits + balance.rollover_credits,
    };
  }

  @Get('packs')
  async getPacks() {
    return this.creditPackRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  @Post('credits/purchase')
  async purchaseCreditPack(
    @Body() dto: CreditPackCheckoutDto,
    @User() user: PublicUserProfile,
  ) {
    if (!this.stripeService.isConfigured()) {
      throw new HttpException('Payments not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const pack = await this.creditPackRepo.findOne({
      where: { id: dto.pack_id, is_active: true },
    });

    if (!pack || !pack.stripe_price_id) {
      throw new HttpException('Credit pack not found or not purchasable', HttpStatus.BAD_REQUEST);
    }

    const customerId = await this.stripeService.getOrCreateCustomer(
      user.user_name,
      user.name,
      { userId: String(user.id) },
    );

    const checkoutUrl = await this.stripeService.createCreditPackCheckout(
      customerId,
      pack.stripe_price_id,
      dto.success_url,
      dto.cancel_url,
      { userId: String(user.id), packId: String(pack.id), credits: String(pack.credits) },
    );

    return { url: checkoutUrl };
  }

  @Get('credits/transactions')
  async getTransactions(
    @User() user: PublicUserProfile,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.creditService.getTransactions(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
