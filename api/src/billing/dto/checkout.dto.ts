import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SubscriptionCheckoutDto {
  @IsNumber()
  plan_id: number;

  @IsString()
  success_url: string;

  @IsString()
  cancel_url: string;
}

export class CreditPackCheckoutDto {
  @IsNumber()
  pack_id: number;

  @IsString()
  success_url: string;

  @IsString()
  cancel_url: string;
}

export class AdminCreditAdjustDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}

export class AdminPlanOverrideDto {
  @IsNumber()
  plan_id: number;
}
