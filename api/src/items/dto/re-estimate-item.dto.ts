import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ReEstimateItemDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  originalBrand?: string;

  @IsOptional()
  @IsString()
  originalModel?: string;

  @IsOptional()
  @IsString()
  originalCategory?: string;

  @IsOptional()
  @IsNumberString()
  originalPrice?: string;
}
