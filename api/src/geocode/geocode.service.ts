import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodeResult {
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);
  private readonly googleApiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (this.googleApiKey) {
      this.logger.log('Google Maps Geocoding API configured');
    } else {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set - geocoding will not work');
    }
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address || !address.trim()) {
      return null;
    }

    if (!this.googleApiKey) {
      this.logger.error('Google Maps API key not configured');
      return null;
    }

    const cleanAddress = address.trim();

    try {
      const encodedAddress = encodeURIComponent(cleanAddress);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.googleApiKey}&region=za`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(`Google Geocoding API HTTP error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        this.logger.error(`Google Geocoding API request denied: ${data.error_message}`);
        return null;
      }

      if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
        this.logger.warn(`No results found for address: ${address}`);
        return null;
      }

      if (data.status !== 'OK') {
        this.logger.error(`Google Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        return null;
      }

      const result = data.results[0];
      
      return {
        formattedAddress: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      };
    } catch (error) {
      this.logger.error(`Geocoding failed for address: ${address}`, error);
      return null;
    }
  }
}
