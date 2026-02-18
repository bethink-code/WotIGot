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
  UseGuards,
} from '@nestjs/common';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { RoomsService } from '../services/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { HousesService } from '../services/houses.service';
import { ItemsService } from 'src/items/services/items.service';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('rooms')
@UseGuards(DatabaseReadyGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly housesService: HousesService,
    private readonly itemsService: ItemsService,
  ) {}

  @Post()
  async create(@Body() data: CreateRoomDto, @User() user: PublicUserProfile) {
    const house = await this.housesService.findHouseById(data.house_id);
    if (!house) {
      throw new NotFoundException('House not found');
    }

    if (house.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return this.roomsService.createRoom(data, user.id);
  }

  @Get()
  async getUserRooms(@User() user: PublicUserProfile) {
    return this.roomsService.findUserRooms(user.id);
  }

  @Get(':id')
  async getRoom(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    return this._getRoom(id, user);
  }

  @Put(':id')
  async updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreateRoomDto>,
    @User() user: PublicUserProfile,
  ) {
    await this._getRoom(id, user);
    return this.roomsService.updateRoom(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteRoom(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const room = await this._getRoom(id, user);
    await this.roomsService.deleteRoom(room.id);
  }

  @Get(':id/items')
  async getRoomItems(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const room = await this._getRoom(id, user);
    return this.itemsService.findRoomItems(room.id);
  }

  @Get(':id/totals')
  async getHouseTotals(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    await this._getRoom(id, user);
    return this.itemsService.getTotals({ room_id: id });
  }

  private async _getRoom(id: number, user: PublicUserProfile) {
    const room = await this.roomsService.findRoomById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.owner_id !== user.id) {
      throw new ForbiddenException();
    }
    return room;
  }
}
