import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { RoomsService } from '../services/rooms.service';
import { ItemsService } from '../services/items.service';
import { ItemImagesService } from '../services/item-images.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { AddItemImageDto } from '../dto/add-item-image.dto';
import { ReEstimateItemDto } from '../dto/re-estimate-item.dto';
import { HousesService } from '../services/houses.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecognizerService } from 'src/items/services/recognizer.service';
import { AskPriceDto } from 'src/items/dto/ask-price.dto';
import { UpdateItemDto } from 'src/items/dto/update-item.dto';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('items')
@UseGuards(DatabaseReadyGuard)
export class ItemsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly housesService: HousesService,
    private readonly itemsService: ItemsService,
    private readonly itemImagesService: ItemImagesService,
    private readonly recognizerService: RecognizerService,
  ) {}

  @Post()
  async create(@Body() data: CreateItemDto, @User() user: PublicUserProfile) {
    const room = await this.roomsService.findRoomById(data.room_id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return this.itemsService.createItem(data, room, user.id);
  }

  @Put(':id')
  async update(
    @Body() data: UpdateItemDto,
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return this.itemsService.updateItem(data, item);
  }

  @Get()
  async getUserItems(@User() user: PublicUserProfile) {
    return this.itemsService.findUserItems(user.id);
  }

  @Get(':id')
  async getItem(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return item;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    await this.itemImagesService.deleteAllForItem(item.id);
    await this.itemsService.deleteItem(item.id);
  }

  @Post('/recognition')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async recognition(@UploadedFile() file: Express.Multer.File) {
    return this.recognizerService.recognizeItem(file);
  }

  @Post('/ask-price')
  @HttpCode(200)
  async askPrice(@Body() data: AskPriceDto) {
    return this.recognizerService.askPrice(data);
  }

  @Post('/re-recognize')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async reRecognize(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: ReEstimateItemDto,
  ) {
    const userValues = {
      brand: data.brand,
      model: data.model,
      category: data.category,
    };
    const originalValues = {
      brand: data.originalBrand,
      model: data.originalModel,
      category: data.originalCategory,
      price: data.originalPrice ? Number(data.originalPrice) : undefined,
    };
    return this.recognizerService.reEstimateFromFile(file, userValues, originalValues);
  }

  @Post(':id/re-estimate')
  @HttpCode(200)
  async reEstimate(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ReEstimateItemDto,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    const imageUrl = item.image;

    if (!imageUrl) {
      throw new NotFoundException('No primary image found for this item');
    }

    return this.recognizerService.reEstimateFromUrl(imageUrl, {
      brand: data.brand,
      model: data.model,
      category: data.category,
    }, {
      brand: item.brand,
      model: item.description,
      category: item.category,
      price: item.price,
    });
  }

  @Get(':id/images')
  async getItemImages(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return this.itemImagesService.findByItemId(id);
  }

  @Post(':id/images')
  async addItemImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddItemImageDto,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return this.itemImagesService.addImage(
      id,
      data.url,
      data.is_primary ?? false,
      data.location_lat,
      data.location_long,
      data.thumbnail_url,
    );
  }

  @Delete(':id/images/:imageId')
  @HttpCode(204)
  async deleteItemImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    const deleted = await this.itemImagesService.deleteImage(imageId, id);
    if (!deleted) {
      throw new NotFoundException('Image not found for this item');
    }
  }

  @Put(':id/images/:imageId/primary')
  async setPrimaryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @User() user: PublicUserProfile,
  ) {
    const item = await this.itemsService.findItemById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    const updated = await this.itemImagesService.setPrimaryImage(imageId, id);
    if (!updated) {
      throw new NotFoundException('Image not found for this item');
    }
    return { success: true };
  }
}
