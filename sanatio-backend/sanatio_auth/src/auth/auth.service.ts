import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(emailOrPhone: string, password: string) {
    const user = await this.userService.findByEmailOrPhone(emailOrPhone);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.emailOrPhone, dto.password);
    const accessToken = this.accessTokenService.generateToken(user);
    const refreshToken = await this.refreshTokenService.generateToken(user);
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    const user = await this.refreshTokenService.verifyToken(refreshToken);
    const newAccessToken = this.accessTokenService.generateToken(user);
    return { accessToken: newAccessToken };
  }

  async logout(userId: string) {
    await this.refreshTokenService.revokeToken(userId);
    return { message: 'Logged out successfully' };
  }
}
