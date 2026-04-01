import { Module } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [GeocodeController],
  providers: [GeocodeService],
  exports: [GeocodeService],
})
export class GeocodeModule {}
