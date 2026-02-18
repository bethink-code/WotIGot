import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { User } from './user.decorator';
import { PublicUserProfile } from '../users/user.entity';
import { DatabaseReadyGuard } from '../database/database-ready.guard';
import { pick } from 'lodash';

@Controller('auth')
@UseGuards(DatabaseReadyGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() data: LoginDto, @User() user?: PublicUserProfile) {
    if (!user) {
      throw new UnauthorizedException();
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  @Get('me')
  async profile(@User() user?: PublicUserProfile) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  /**
   * Endpoint to refresh access token
   */
  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is not provided');
    }

    try {
      const newAccessToken =
        await this.authService.refreshAccessToken(refreshToken);

      return { access_token: newAccessToken, refresh_token: refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Update user profile
   */
  @Put('profile')
  async updateProfile(
    @User() user: PublicUserProfile,
    @Body() data: { name: string },
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Name is required');
    }

    const updatedUser = await this.usersService.updateProfile(user.id, {
      name: data.name.trim(),
    });

    return pick(updatedUser, ['id', 'name', 'user_name', 'role']);
  }

  /**
   * Change user password
   */
  @Put('password')
  async changePassword(
    @User() user: PublicUserProfile,
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!data.currentPassword || !data.newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    if (data.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    try {
      await this.usersService.changePassword(
        user.id,
        data.currentPassword,
        data.newPassword,
      );
      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
