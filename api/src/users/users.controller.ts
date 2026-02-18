import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { DatabaseReadyGuard } from '../database/database-ready.guard';

@Controller('users')
@UseGuards(DatabaseReadyGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  async create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ) {
    return this.usersService.update(id, data);
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  async list() {
    return this.usersService.find();
  }

  @Get(':username')
  @UseGuards(SuperAdminGuard)
  async getOne(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
