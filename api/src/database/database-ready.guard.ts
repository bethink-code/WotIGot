import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { LazyDatabaseService, DatabaseState } from './lazy-database.service';

@Injectable()
export class DatabaseReadyGuard implements CanActivate {
  constructor(private lazyDb: LazyDatabaseService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.lazyDb.isConnected()) {
      return true;
    }

    const state = this.lazyDb.getState();
    const error = this.lazyDb.getLastError();

    throw new ServiceUnavailableException({
      message: 'Database is not ready yet',
      state,
      error,
      retryAfter: 5,
    });
  }
}
