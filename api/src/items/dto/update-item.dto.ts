import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PriceType } from 'src/items/entities/item.entity';

export class UpdateItemDto {
  @IsNumber()
  price: number;

  @IsEnum(PriceType)
  price_type: PriceType;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  @IsOptional()
  serial_number?: string;
}
