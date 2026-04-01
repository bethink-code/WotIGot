import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CREDIT_COST_KEY } from '../decorators/credit-cost.decorator';
import { CreditService } from '../services/credit.service';

@Injectable()
export class CreditCheckGuard implements CanActivate {
  private readonly logger = new Logger(CreditCheckGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly creditService: CreditService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip enforcement if feature flag is off
    const enforcementEnabled = this.config.get('BILLING_ENFORCEMENT_ENABLED', 'false');
    if (enforcementEnabled !== 'true') {
      return true;
    }

    const cost = this.reflector.getAllAndOverride<number>(CREDIT_COST_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!cost) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return true; // Let auth guard handle unauthenticated requests
    }

    const totalCredits = await this.creditService.getTotalCredits(user.id);

    if (totalCredits < cost) {
      throw new HttpException(
        {
          message: 'Insufficient credits',
          required: cost,
          available: totalCredits,
          upgradeUrl: '/billing',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Store cost on request for post-execution deduction
    request.creditCost = cost;
    return true;
  }
}
