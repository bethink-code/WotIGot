import { SetMetadata } from '@nestjs/common';
import { PlanTier } from '../entities/subscription-plan.entity';

export const REQUIRES_PLAN_KEY = 'requiresPlan';
export const RequiresPlan = (...tiers: PlanTier[]) => SetMetadata(REQUIRES_PLAN_KEY, tiers);
