import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GeocodeService, GeocodeResult } from './geocode.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { Public } from '../auth/public.decorator';

class GeocodeDto {
  @IsString()
  @IsNotEmpty()
  address: string;
}

@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @Post()
  @Public()
  async geocode(@Body() dto: GeocodeDto): Promise<GeocodeResult> {
    const result = await this.geocodeService.geocodeAddress(dto.address);

    if (!result) {
      throw new HttpException(
        'Address not found. Please check the address and try again.',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }
}
