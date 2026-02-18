import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class IndexController {
  /**
   * Health check endpoint to check if the service is up and running.
   */
  @Get()
  @Public()
  healthCheck() {
    return 'OK';
  }
}
