import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { LazyDatabaseService, DatabaseState } from './lazy-database.service';

@Controller('health')
export class HealthController {
  constructor(private lazyDb: LazyDatabaseService) {}

  @Get()
  @Public()
  getHealth() {
    const state = this.lazyDb.getState();
    const isConnected = this.lazyDb.isConnected();

    return {
      status: isConnected ? 'ok' : 'degraded',
      database: {
        state,
        connected: isConnected,
        error: this.lazyDb.getLastError(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @Public()
  getReadiness() {
    const isConnected = this.lazyDb.isConnected();
    
    return {
      ready: isConnected,
      database: isConnected ? 'connected' : this.lazyDb.getState(),
    };
  }
}
