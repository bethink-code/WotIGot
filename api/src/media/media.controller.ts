import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { User } from '../auth/user.decorator';
import { PublicUserProfile } from '../users/user.entity';
import { MediaService } from './media.service';
import { GetSignedUrlToUploadMediaDto } from './dto/get-signed-url-to-upload-media.dto';
import { DatabaseReadyGuard } from '../database/database-ready.guard';

@Controller('media')
@UseGuards(DatabaseReadyGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post()
  async getSignedUrlToUploadMedia(
    @User() user: PublicUserProfile,
    @Body() { fileName }: GetSignedUrlToUploadMediaDto,
  ) {
    const urls = await this.mediaService.getUrlToUploadMedia(fileName, user.id);
    return {
      url: urls.originalUrl,
      thumbnailUploadUrl: urls.thumbnailUrl,
      originalKey: urls.originalKey,
      thumbnailKey: urls.thumbnailKey,
      bucket: this.mediaService.getPublicUrl('').replace(/\/$/, ''),
    };
  }
}
