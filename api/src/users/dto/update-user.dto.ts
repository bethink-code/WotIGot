import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(2)
  user_name: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
