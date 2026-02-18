import { ForbiddenException, Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PublicUserProfile } from '../users/user.entity';
import { pick } from 'lodash';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './refresh-token.entity';
import { LazyRepository } from '../database/lazy-repository';
import { REFRESH_TOKEN_REPOSITORY } from '../database/repository-tokens';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,

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
    if (user && user.password) {
      const passwordValid = await this.usersService.validatePassword(pass, user.password);
      if (passwordValid) {
        return pick(user, ['id', 'name', 'user_name', 'role']);
      }
    }
    return null;
  }

  /**
   * Verify Google ID token, find or create user, return PublicUserProfile
   */
  async validateGoogleToken(idToken: string): Promise<PublicUserProfile> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const { sub: googleId, email, name } = payload;

    // 1. Check if user already exists with this Google ID
    let user = await this.usersService.findByGoogleId(googleId);
    if (user) {
      return pick(user, ['id', 'name', 'user_name', 'role']);
    }

    // 2. Check if a user exists with the same email — link it
    user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.findOne(email);
    }

    if (user) {
      await this.usersService.linkGoogleAccount(user.id, googleId, email);
      return pick(user, ['id', 'name', 'user_name', 'role']);
    }

    // 3. No existing user — create a new one
    user = await this.usersService.createFromGoogle({
      name: name || email.split('@')[0],
      email,
      google_id: googleId,
    });

    return pick(user, ['id', 'name', 'user_name', 'role']);
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
