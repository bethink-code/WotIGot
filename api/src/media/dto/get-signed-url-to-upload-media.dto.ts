import { IsString } from 'class-validator';

export class GetSignedUrlToUploadMediaDto {
  @IsString()
  fileName: string;
}
