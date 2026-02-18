import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddItemImageDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsNumber()
  @IsOptional()
  location_lat?: number;

  @IsNumber()
  @IsOptional()
  location_long?: number;
}
