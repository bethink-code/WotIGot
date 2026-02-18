import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3Client = new S3Client({ region: this.config.get('AWS_REGION') });
    this.bucket = this.config.get('AWS_S3_BUCKET') || '';
  }

  /**
   * Generate signed URLs to upload both original and thumbnail to S3
   * @param fileName Name of the file
   * @param userId ID of the user who owns the file
   */
  async getUrlToUploadMedia(fileName: string, userId: number) {
    const originalKey = `${userId}/${fileName}`;
    const thumbnailKey = `${userId}/thumbs/${fileName}`;

    const originalCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: originalKey,
      ACL: 'public-read',
    });

    const thumbnailCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: thumbnailKey,
      ACL: 'public-read',
    });

    const [originalUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(this.s3Client, originalCommand, { expiresIn: 3600 }),
      getSignedUrl(this.s3Client, thumbnailCommand, { expiresIn: 3600 }),
    ]);

    return {
      originalUrl,
      thumbnailUrl,
      originalKey,
      thumbnailKey,
    };
  }

  /**
   * Get the public URL for a given S3 key
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${key}`;
  }
}
