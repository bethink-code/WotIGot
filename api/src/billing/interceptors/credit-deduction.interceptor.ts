import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CREDIT_COST_KEY } from '../decorators/credit-cost.decorator';
import { CreditService } from '../services/credit.service';
import { UsageActionType } from '../entities/usage-log.entity';

/**
 * Interceptor that atomically deducts credits before the handler executes
 * and refunds them if the handler throws an error.
 */
@Injectable()
export class CreditDeductionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CreditDeductionInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly creditService: CreditService,
    private readonly config: ConfigService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const enforcementEnabled = this.config.get('BILLING_ENFORCEMENT_ENABLED', 'false');
    if (enforcementEnabled !== 'true') {
      // Still track usage if tracking is enabled
      const trackingEnabled = this.config.get('BILLING_TRACKING_ENABLED', 'true');
      if (trackingEnabled === 'true') {
        return this.trackOnly(context, next);
      }
      return next.handle();
    }

    const cost = this.reflector.getAllAndOverride<number>(CREDIT_COST_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!cost) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return next.handle();
    }

    const actionType = this.getActionType(context);

    // Atomically deduct credits
    const result = await this.creditService.attemptDeduction(
      user.id,
      cost,
      actionType,
      { endpoint: context.getHandler().name },
    );

    if (!result.success) {
      throw new HttpException(
        {
          message: 'Insufficient credits',
          required: cost,
          available: result.available,
          upgradeUrl: '/billing',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Store deduction ID for potential refund
    request.creditDeductionId = result.deductionId;

    return next.handle().pipe(
      catchError((err) => {
        // Refund credits if the AI call fails
        if (result.deductionId) {
          this.creditService.refundDeduction(result.deductionId).catch((refundErr) => {
            this.logger.error(`Failed to refund deduction ${result.deductionId}: ${refundErr.message}`);
          });
        }
        return throwError(() => err);
      }),
    );
  }

  /**
   * Track-only mode: logs usage without deducting credits.
   */
  private trackOnly(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cost = this.reflector.getAllAndOverride<number>(CREDIT_COST_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!cost) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return next.handle();
    }

    const actionType = this.getActionType(context);

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget usage logging
        this.creditService.attemptDeduction(user.id, 0, actionType, {
          endpoint: context.getHandler().name,
          tracking_only: true,
          would_cost: cost,
        }).catch(() => {
          // Ignore tracking failures
        });
      }),
    );
  }

  private getActionType(context: ExecutionContext): UsageActionType {
    const handler = context.getHandler().name;
    switch (handler) {
      case 'recognition':
        return UsageActionType.ScanItem;
      case 'reRecognize':
        return UsageActionType.ReRecognize;
      case 'reEstimate':
        return UsageActionType.ReEstimate;
      case 'askPrice':
        return UsageActionType.AskPrice;
      case 'geocode':
        return UsageActionType.Geocode;
      default:
        return UsageActionType.ScanItem;
    }
  }
}
