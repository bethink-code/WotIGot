import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from '../services/subscription.service';

@Injectable()
export class FeatureGateGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGateGuard.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const enforcementEnabled = this.config.get('BILLING_ENFORCEMENT_ENABLED', 'false');
    if (enforcementEnabled !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      return true;
    }

    const handler = context.getHandler().name;
    const controllerName = context.getClass().name;

    // Determine which limit to check based on the route
    let limitType: 'max_properties' | 'max_rooms_per_property' | 'max_items' | null = null;

    if (controllerName === 'HousesController' && handler === 'create') {
      limitType = 'max_properties';
    } else if (controllerName === 'RoomsController' && handler === 'create') {
      limitType = 'max_rooms_per_property';
    } else if (controllerName === 'ItemsController' && handler === 'create') {
      limitType = 'max_items';
    }

    if (!limitType) {
      return true;
    }

    const limit = await this.subscriptionService.checkLimit(user.id, limitType);

    // -1 means unlimited
    if (limit === -1) {
      return true;
    }

    // Store limit info on request for controllers to use
    request.planLimit = { type: limitType, limit };
    return true;
  }
}
