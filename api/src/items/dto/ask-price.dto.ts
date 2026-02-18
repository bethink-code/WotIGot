import { IsString } from 'class-validator';

export class AskPriceDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;
}
