import { Module, Global, OnApplicationBootstrap } from '@nestjs/common';
import { LazyDatabaseService } from './lazy-database.service';
import { HealthController } from './health.controller';
import { DatabaseReadyGuard } from './database-ready.guard';
import { createLazyRepositoryProvider } from './lazy-repository';
import { User } from '../users/user.entity';
import { House } from '../items/entities/house.entity';
import { Room } from '../items/entities/room.entity';
import { Item } from '../items/entities/item.entity';
import { ItemImage } from '../items/entities/item-image.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
  HOUSE_REPOSITORY,
  ROOM_REPOSITORY,
  ITEM_REPOSITORY,
  ITEM_IMAGE_REPOSITORY,
} from './repository-tokens';

@Global()
@Module({
  providers: [
    LazyDatabaseService,
    DatabaseReadyGuard,
    createLazyRepositoryProvider(RefreshToken, REFRESH_TOKEN_REPOSITORY),
    createLazyRepositoryProvider(User, USER_REPOSITORY),
    createLazyRepositoryProvider(House, HOUSE_REPOSITORY),
    createLazyRepositoryProvider(Room, ROOM_REPOSITORY),
    createLazyRepositoryProvider(Item, ITEM_REPOSITORY),
    createLazyRepositoryProvider(ItemImage, ITEM_IMAGE_REPOSITORY),
  ],
  controllers: [HealthController],
  exports: [
    LazyDatabaseService,
    DatabaseReadyGuard,
    REFRESH_TOKEN_REPOSITORY,
    USER_REPOSITORY,
    HOUSE_REPOSITORY,
    ROOM_REPOSITORY,
    ITEM_REPOSITORY,
    ITEM_IMAGE_REPOSITORY,
  ],
})
export class LazyDatabaseModule implements OnApplicationBootstrap {
  constructor(private lazyDb: LazyDatabaseService) {}

  async onApplicationBootstrap() {
    // Start database connection AFTER app has bootstrapped
    // This happens after app.listen() so it doesn't block port 5000
    this.lazyDb.startConnection().catch(err => {
      console.error('Background database connection failed, will retry:', err.message);
    });
  }
}
