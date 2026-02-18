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
  Res,
  UseGuards,
} from '@nestjs/common';
import { HousesService } from '../services/houses.service';
import { CreateHouseDto } from '../dto/create-house.dto';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { RoomsService } from '../services/rooms.service';
import { ItemsService } from 'src/items/services/items.service';
import { keyBy, snakeCase } from 'lodash';
import { utils, write } from 'xlsx';
import { Response } from 'express';
import { priceTypeNameMap } from 'src/items/entities/item.entity';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('houses')
@UseGuards(DatabaseReadyGuard)
export class HousesController {
  constructor(
    private readonly housesService: HousesService,
    private readonly roomsService: RoomsService,
    private readonly itemsService: ItemsService,
  ) {}

  @Post()
  async createHouse(
    @Body() data: CreateHouseDto,
    @User() user: PublicUserProfile,
  ) {
    return this.housesService.createHouse(data, user.id);
  }

  @Get()
  async getUserHouses(@User() user: PublicUserProfile) {
    const houses = await this.housesService.findUserHouses(user.id);
    
    const housesWithTotals = await Promise.all(
      houses.map(async (house) => {
        const totals = await this.itemsService.getTotals({ house_id: house.id });
        return {
          ...house,
          total_value: totals.total_price,
          total_items: totals.total_items,
        };
      }),
    );
    
    return housesWithTotals;
  }

  @Get(':id')
  async getHouse(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    return this._getHouse(id, user);
  }

  @Put(':id')
  async updateHouse(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CreateHouseDto>,
    @User() user: PublicUserProfile,
  ) {
    await this._getHouse(id, user);
    return this.housesService.updateHouse(id, data);
  }

  @Get(':id/totals')
  async getHouseTotals(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    await this._getHouse(id, user);
    return this.itemsService.getTotals({ house_id: id });
  }

  @Get(':id/rooms')
  async getHouseRooms(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    await this._getHouse(id, user);
    const rooms = await this.roomsService.findHouseRooms(id);
    
    const roomsWithTotals = await Promise.all(
      rooms.map(async (room) => {
        const totals = await this.itemsService.getTotals({ room_id: room.id });
        return {
          ...room,
          total_value: totals.total_price,
          total_items: totals.total_items,
        };
      }),
    );
    
    return roomsWithTotals;
  }

  /**
   * Export house items to an Excel file.
   */
  @Get(':id/xlsx')
  async exportHouse(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
    @Res() res: Response,
  ) {
    const house = await this._getHouse(id, user);
    const rooms = await this.roomsService.findHouseRooms(house.id);
    const roomsMap = keyBy(rooms, 'id');
    const items = await this.itemsService.findHouseItems(house.id);

    const data = items.map((item) => ({
      room: roomsMap[item.room_id]?.name,
      brand: item.brand,
      model: item.model,
      category: item.category,
      serial_number: item.serial_number,
      amount: item.amount,
      price: item.price,
      price_type: priceTypeNameMap[item.price_type],
      total: item.amount * item.price,
    }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];
    utils.book_append_sheet(wb, ws, house.name);
    const buffer = write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });
    res.header(
      'Content-Disposition',
      `attachment; filename="${snakeCase(house.name)}_${Date.now()}.xlsx"`,
    );
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.end(buffer);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteHouse(
    @Param('id', ParseIntPipe) id: number,
    @User() user: PublicUserProfile,
  ) {
    const house = await this._getHouse(id, user);
    await this.roomsService.deleteHouseRooms(house.id);
    await this.housesService.deleteHouse(house.id);
  }

  private async _getHouse(id: number, user: PublicUserProfile) {
    const house = await this.housesService.findHouseById(id);
    if (!house) {
      throw new NotFoundException('House not found');
    }

    if (house.owner_id !== user.id) {
      throw new ForbiddenException();
    }

    return house;
  }
}
