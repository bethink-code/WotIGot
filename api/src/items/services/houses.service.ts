import { Injectable, Inject } from '@nestjs/common';
import { House } from '../entities/house.entity';
import { CreateHouseDto } from '../dto/create-house.dto';
import { LazyRepository } from '../../database/lazy-repository';
import { HOUSE_REPOSITORY } from '../../database/repository-tokens';

@Injectable()
export class HousesService {
  constructor(
    @Inject(HOUSE_REPOSITORY)
    private houseRepository: LazyRepository<House>,
  ) {}

  async findUserHouses(userId: number): Promise<House[]> {
    return this.houseRepository.find({ where: { owner_id: userId } });
  }

  async findHouseById(houseId: number): Promise<House | null> {
    return this.houseRepository.findOne({ where: { id: houseId } });
  }

  async createHouse(data: CreateHouseDto, ownerId: number): Promise<House> {
    const house = await this.houseRepository.create({
      ...data,
      owner_id: ownerId,
    });
    return this.houseRepository.save(house);
  }

  async updateHouse(
    houseId: number,
    data: Partial<CreateHouseDto>,
  ): Promise<House> {
    await this.houseRepository.update(houseId, data);
    return this.findHouseById(houseId);
  }

  async deleteHouse(houseId: number): Promise<void> {
    await this.houseRepository.delete(houseId);
  }
}
