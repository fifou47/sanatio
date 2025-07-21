import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

@Injectable()
export class RefreshTokenService {
  private refreshTokens: Map<string, string> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async generateToken(user: any): Promise<string> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not defined in environment');
    }


    const token = jwt.sign(
    { sub: user.id },
    refreshSecret,
    { expiresIn: '7d' }
    );

    this.refreshTokens.set(user.id, token);
    return token;
  }

  async verifyToken(token: string): Promise<any> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not defined');
    }

    try {
      const payload = jwt.verify(token, refreshSecret) as { sub: string };

      const storedToken = this.refreshTokens.get(payload.sub);
      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Refresh token not recognized');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      return user;
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeToken(userId: string): Promise<void> {
    this.refreshTokens.delete(userId);
  }
}
