import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly sessionService: SessionService,
  ) {}

  async validateUser(emailOrPhone: string, password: string) {
    const user = await this.userService.findByEmailOrPhone(emailOrPhone);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(dto: LoginDto, context: { userAgent: string | null; ip: string | null }) {
    const user = await this.validateUser(dto.emailOrPhone, dto.password);
    const session = await this.sessionService.create(user.id, context.userAgent, context.ip);
    const accessToken = this.accessTokenService.generateToken(user, session.sessionId);
    const refreshToken = await this.refreshTokenService.generateToken(user, session.sessionId);
    return { accessToken, refreshToken, sessionId: session.sessionId };
  }

  async refreshToken(refreshToken: string) {
    const { user, sessionId } = await this.refreshTokenService.verifyToken(refreshToken);
    await this.sessionService.touch(sessionId);
    const newAccessToken = this.accessTokenService.generateToken(user, sessionId);
    return { accessToken: newAccessToken, sessionId };
  }

  async logout(userId: string, sessionId?: string | null) {
    if (sessionId) {
      try {
        await this.sessionService.terminate(userId, sessionId);
      } catch (err) {
        if (!(err instanceof NotFoundException)) {
          throw err;
        }
      }
      await this.refreshTokenService.revokeTokenBySession(sessionId);
    } else {
      await this.sessionService.terminateAllForUser(userId);
      await this.refreshTokenService.revokeToken(userId);
    }
    return { message: 'Logged out successfully' };
  }
}
