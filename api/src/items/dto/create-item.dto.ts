import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PriceType } from 'src/items/entities/item.entity';

export class CreateItemDto {
  @IsInt()
  room_id: number;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsEnum(PriceType)
  @IsOptional()
  price_type?: PriceType;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsNumber()
  @IsOptional()
  location_lat?: number;

  @IsNumber()
  @IsOptional()
  location_long?: number;

  @IsString()
  @IsOptional()
  image?: string;
}
