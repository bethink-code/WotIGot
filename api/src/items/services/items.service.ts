import { Injectable, Inject } from '@nestjs/common';
import { Item } from '../entities/item.entity';
import { CreateItemDto } from '../dto/create-item.dto';
import { Room } from 'src/items/entities/room.entity';
import { UpdateItemDto } from 'src/items/dto/update-item.dto';
import { LazyRepository } from '../../database/lazy-repository';
import { ITEM_REPOSITORY } from '../../database/repository-tokens';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEM_REPOSITORY)
    private itemRepository: LazyRepository<Item>,
  ) {}

  async findUserItems(userId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { owner_id: userId } });
  }

  async findHouseItems(houseId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { house_id: houseId } });
  }

  async findRoomItems(roomId: number): Promise<Item[]> {
    return this.itemRepository.find({ where: { room_id: roomId } });
  }

  async findItemById(itemId: number): Promise<Item | null> {
    return this.itemRepository.findOne({ where: { id: itemId } });
  }

  async createItem(
    data: CreateItemDto,
    room: Room,
    ownerId: number,
  ): Promise<Item> {
    const item = await this.itemRepository.create({
      ...data,
      room_id: room.id,
      house_id: room.house_id,
      owner_id: ownerId,
    });
    return this.itemRepository.save(item);
  }

  async updateItem(data: UpdateItemDto, item: Item): Promise<Item> {
    item.description = data.description;
    item.category = data.category;
    item.brand = data.brand;
    item.model = data.model;
    item.price = data.price;
    item.price_type = data.price_type;
    item.amount = data.amount;
    item.serial_number = data.serial_number;
    return this.itemRepository.save(item);
  }

  async deleteItem(itemId: number): Promise<void> {
    await this.itemRepository.delete(itemId);
  }

  /**
   * Aggregate the total price and total number of items for a house or room.
   */
  async getTotals({
    house_id,
    room_id,
  }: {
    house_id?: number;
    room_id?: number;
  }): Promise<{ total_price: number; total_items: number }> {
    const query = await this.itemRepository.createQueryBuilder('item');
    if (house_id) {
      query.andWhere('item.house_id = :house_id', { house_id });
    }
    if (room_id) {
      query.andWhere('item.room_id = :room_id', { room_id });
    }

    const totals = await query
      .select('sum(item.amount * coalesce(item.price, 0))', 'total_price')
      .addSelect('COUNT(item.id)', 'total_items')
      .getRawOne();

    return {
      total_price: Number(totals.total_price),
      total_items: Number(totals.total_items),
    };
  }
}
