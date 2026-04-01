import { Module } from '@nestjs/common';
import { LazyDatabaseModule } from '../database/lazy-database.module';

// Services
import { CreditService } from './services/credit.service';
import { SubscriptionService } from './services/subscription.service';
import { StripeService } from './services/stripe.service';
import { UsageTrackingService } from './services/usage-tracking.service';

// Controllers
import { SubscriptionController } from './controllers/subscription.controller';
import { CreditsController } from './controllers/credits.controller';
import { UsageController } from './controllers/usage.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { AdminBillingController } from './controllers/admin-billing.controller';

// Guards & Interceptors
import { CreditCheckGuard } from './guards/credit-check.guard';
import { FeatureGateGuard } from './guards/feature-gate.guard';
import { CreditDeductionInterceptor } from './interceptors/credit-deduction.interceptor';

@Module({
  imports: [LazyDatabaseModule],
  providers: [
    CreditService,
    SubscriptionService,
    StripeService,
    UsageTrackingService,
    CreditCheckGuard,
    FeatureGateGuard,
    CreditDeductionInterceptor,
  ],
  controllers: [
    SubscriptionController,
    CreditsController,
    UsageController,
    StripeWebhookController,
    AdminBillingController,
  ],
  exports: [
    CreditService,
    SubscriptionService,
    StripeService,
    UsageTrackingService,
    CreditCheckGuard,
    FeatureGateGuard,
    CreditDeductionInterceptor,
  ],
})
export class BillingModule {}
