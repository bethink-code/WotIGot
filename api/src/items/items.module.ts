import { Module } from '@nestjs/common';
import { ItemsService } from './services/items.service';
import { ItemImagesService } from './services/item-images.service';
import { HousesService } from './services/houses.service';
import { RoomsService } from './services/rooms.service';
import { HousesController } from './controllers/houses.controller';
import { RoomsController } from './controllers/rooms.controller';
import { ItemsController } from './controllers/items.controller';
import { ReportsController } from './controllers/reports.controller';
import { RecognizerService } from 'src/items/services/recognizer.service';

@Module({
  providers: [ItemsService, ItemImagesService, HousesService, RoomsService, RecognizerService],
  controllers: [HousesController, RoomsController, ItemsController, ReportsController],
})
export class ItemsModule {}
