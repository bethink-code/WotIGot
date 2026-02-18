import { Injectable, Inject } from '@nestjs/common';
import { ItemImage } from '../entities/item-image.entity';
import { LazyRepository } from '../../database/lazy-repository';
import { ITEM_IMAGE_REPOSITORY } from '../../database/repository-tokens';

@Injectable()
export class ItemImagesService {
  constructor(
    @Inject(ITEM_IMAGE_REPOSITORY)
    private itemImageRepository: LazyRepository<ItemImage>,
  ) {}

  async findByItemId(itemId: number): Promise<ItemImage[]> {
    return this.itemImageRepository.find({
      where: { item_id: itemId },
      order: { is_primary: 'DESC', created_at: 'ASC' },
    });
  }

  async addImage(
    itemId: number,
    url: string,
    isPrimary: boolean = false,
    locationLat?: number,
    locationLong?: number,
    thumbnailUrl?: string,
  ): Promise<ItemImage> {
    if (isPrimary) {
      await this.itemImageRepository.update(
        { item_id: itemId },
        { is_primary: false },
      );
    }

    const image = await this.itemImageRepository.create({
      item_id: itemId,
      url,
      thumbnail_url: thumbnailUrl || null,
      is_primary: isPrimary,
      location_lat: locationLat,
      location_long: locationLong,
    });
    return this.itemImageRepository.save(image);
  }

  async findImageById(imageId: number): Promise<ItemImage | null> {
    return this.itemImageRepository.findOne({ where: { id: imageId } });
  }

  async deleteImage(imageId: number, itemId: number): Promise<boolean> {
    const image = await this.itemImageRepository.findOne({
      where: { id: imageId, item_id: itemId },
    });
    if (!image) {
      return false;
    }
    await this.itemImageRepository.delete(imageId);
    return true;
  }

  async setPrimaryImage(imageId: number, itemId: number): Promise<boolean> {
    const image = await this.itemImageRepository.findOne({
      where: { id: imageId, item_id: itemId },
    });
    if (!image) {
      return false;
    }
    await this.itemImageRepository.update(
      { item_id: itemId },
      { is_primary: false },
    );
    await this.itemImageRepository.update({ id: imageId }, { is_primary: true });
    return true;
  }

  async deleteAllForItem(itemId: number): Promise<void> {
    await this.itemImageRepository.delete({ item_id: itemId });
  }
}
