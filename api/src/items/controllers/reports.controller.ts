import {
  Controller,
  Get,
  Res,
  UseGuards,
} from '@nestjs/common';
import { HousesService } from '../services/houses.service';
import { User } from '../../auth/user.decorator';
import { PublicUserProfile } from '../../users/user.entity';
import { RoomsService } from '../services/rooms.service';
import { ItemsService } from '../services/items.service';
import { keyBy } from 'lodash';
import { utils, write } from 'xlsx';
import { Response } from 'express';
import { priceTypeNameMap } from '../entities/item.entity';
import { DatabaseReadyGuard } from '../../database/database-ready.guard';

@Controller('reports')
@UseGuards(DatabaseReadyGuard)
export class ReportsController {
  constructor(
    private readonly housesService: HousesService,
    private readonly roomsService: RoomsService,
    private readonly itemsService: ItemsService,
  ) {}

  @Get('xlsx')
  async exportAllProperties(
    @User() user: PublicUserProfile,
    @Res() res: Response,
  ) {
    const houses = await this.housesService.findUserHouses(user.id);
    
    const wb = utils.book_new();
    let totalItems = 0;
    let grandTotal = 0;

    for (const house of houses) {
      const rooms = await this.roomsService.findHouseRooms(house.id);
      const roomsMap = keyBy(rooms, 'id');
      const items = await this.itemsService.findHouseItems(house.id);

      const data = items.map((item) => {
        const itemTotal = item.amount * item.price;
        totalItems++;
        grandTotal += itemTotal;
        
        return {
          room: roomsMap[item.room_id]?.name || 'Unknown',
          description: item.description,
          brand: item.brand,
          model: item.model,
          category: item.category,
          serial_number: item.serial_number,
          amount: item.amount,
          price: item.price,
          price_type: priceTypeNameMap[item.price_type],
          total: itemTotal,
        };
      });

      if (data.length > 0) {
        const ws = utils.json_to_sheet(data);
        ws['!cols'] = [
          { wch: 15 },
          { wch: 25 },
          { wch: 20 },
          { wch: 20 },
          { wch: 15 },
          { wch: 20 },
          { wch: 10 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
        ];
        const sheetName = house.name.substring(0, 31);
        utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    if (wb.SheetNames.length === 0) {
      const ws = utils.json_to_sheet([{ message: 'No items found in any property' }]);
      utils.book_append_sheet(wb, ws, 'Empty Report');
    }

    const summaryData = houses.map((house) => ({
      property: house.name,
      address: house.address || '',
    }));
    
    if (summaryData.length > 0) {
      const summaryWs = utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [
        { wch: 25 },
        { wch: 40 },
      ];
      utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    const buffer = write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    res.header(
      'Content-Disposition',
      `attachment; filename="wotigot_inventory_${timestamp}.xlsx"`,
    );
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.end(buffer);
  }
}
