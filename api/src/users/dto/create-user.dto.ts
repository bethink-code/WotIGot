import { IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(2)
  user_name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
