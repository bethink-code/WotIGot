import { ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PublicUserProfile } from '../users/user.entity';
import { pick } from 'lodash';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './refresh-token.entity';
import { LazyRepository } from '../database/lazy-repository';
import { REFRESH_TOKEN_REPOSITORY } from '../database/repository-tokens';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,

    @Inject(REFRESH_TOKEN_REPOSITORY)
    private refreshTokenRepository: LazyRepository<RefreshToken>,
  ) {}

  /**
   * Find user by username and validate password
   * @returns Public safe user profile (without sensitive data like password)
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<PublicUserProfile> {
    const user = await this.usersService.findOne(username);
    if (user) {
      const passwordValid = await this.usersService.validatePassword(pass, user.password);
      if (passwordValid) {
        return pick(user, ['id', 'name', 'user_name', 'role']);
      }
    }
    return null;
  }

  /**
   * Issue access token for the given profile
   */
  generateAccessToken(payload: PublicUserProfile): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Generate refresh token for the given JWT payload
   * @param payload JWT Payload from access token
   * @returns Refresh token
   */
  async generateRefreshToken(payload: PublicUserProfile): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { iss: payload.id },
      { expiresIn: '7d' },
    );

    await this.refreshTokenRepository.save({
      userId: payload.id,
      token: refreshToken,
      payload,
    });

    return refreshToken;
  }

  /**
   * Validate refresh token and issue new a access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new ForbiddenException(error.message);
    }

    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });
    if (!refreshTokenEntity) {
      throw new ForbiddenException('Invalid refresh token');
    }

    return this.generateAccessToken(refreshTokenEntity.payload);
  }

  /**
   * Revoke refresh token
   */
  async removeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }
}
