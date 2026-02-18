import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHouseDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  location_lat?: number;

  @IsNumber()
  @IsOptional()
  location_long?: number;
}
