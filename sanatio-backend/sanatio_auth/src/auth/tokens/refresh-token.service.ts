import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { SignOptions, Secret } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectModel(RefreshToken.name)
    private readonly rtModel: Model<RefreshTokenDocument>,
  ) {}

  async generateToken(user: any, sessionId: string): Promise<string> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresInRaw = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresInOpt: SignOptions['expiresIn'] = /^\d+$/.test(expiresInRaw)
      ? Number(expiresInRaw)
      : (expiresInRaw as SignOptions['expiresIn']);
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not defined in environment');
    }
    const token = jwt.sign({ sub: user.id, sessionId }, refreshSecret as Secret, { expiresIn: expiresInOpt });
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + this.parseExpiresInMs(String(expiresInRaw)));
    await this.rtModel.deleteMany({ userId: user.id, sessionId }).exec();
    await this.rtModel.create({ userId: user.id, sessionId, tokenHash, expiresAt });
    return token;
  }

  async verifyToken(token: string): Promise<{ user: any; sessionId: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not defined');
    }
    try {
      const payload = jwt.verify(token, refreshSecret as Secret) as { sub: string; sessionId?: string };
      if (!payload.sessionId) {
        throw new UnauthorizedException('Session identifier missing');
      }
      const rec = await this.rtModel.findOne({ userId: payload.sub, sessionId: payload.sessionId }).exec();
      if (!rec) throw new UnauthorizedException('Refresh token not recognized');
      const match = await bcrypt.compare(token, rec.tokenHash);
      if (!match || rec.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException('Refresh token expired or invalid');
      }
      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      return { user, sessionId: payload.sessionId };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeToken(userId: string): Promise<void> {
    await this.rtModel.deleteMany({ userId }).exec();
  }

  async revokeTokenBySession(sessionId: string): Promise<void> {
    await this.rtModel.deleteMany({ sessionId }).exec();
  }

  private parseExpiresInMs(expr: string): number {
    // supports Nd / Nh / Nm / Ns or seconds number
    const m = /^([0-9]+)([smhd])?$/.exec(expr);
    if (!m) return 7 * 24 * 3600 * 1000;
    const n = Number(m[1]);
    const unit = m[2] || 's';
    const mult = unit === 's' ? 1000 : unit === 'm' ? 60 * 1000 : unit === 'h' ? 3600 * 1000 : 24 * 3600 * 1000;
    return n * mult;
  }
}
