import { Injectable, Inject } from '@nestjs/common';
import { Room } from '../entities/room.entity';
import { CreateRoomDto } from '../dto/create-room.dto';
import { LazyRepository } from '../../database/lazy-repository';
import { ROOM_REPOSITORY } from '../../database/repository-tokens';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private roomRepository: LazyRepository<Room>,
  ) {}

  async findUserRooms(userId: number): Promise<Room[]> {
    return this.roomRepository.find({ where: { owner_id: userId } });
  }

  async findHouseRooms(houseId: number): Promise<Room[]> {
    return this.roomRepository.find({ where: { house_id: houseId } });
  }

  async findRoomById(roomId: number): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { id: roomId } });
  }

  async createRoom(data: CreateRoomDto, ownerId: number): Promise<Room> {
    const room = await this.roomRepository.create({
      ...data,
      owner_id: ownerId,
    });
    return this.roomRepository.save(room);
  }

  async deleteHouseRooms(houseId: number): Promise<void> {
    await this.roomRepository.delete({ house_id: houseId });
  }

  async updateRoom(
    roomId: number,
    data: Partial<CreateRoomDto>,
  ): Promise<Room> {
    await this.roomRepository.update(roomId, data);
    return this.findRoomById(roomId);
  }

  async deleteRoom(roomId: number): Promise<void> {
    await this.roomRepository.delete(roomId);
  }
}
