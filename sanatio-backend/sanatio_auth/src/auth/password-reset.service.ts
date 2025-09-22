import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';

import { PasswordResetToken, PasswordResetTokenDocument } from './schemas/password-reset-token.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class PasswordResetService {
  private static readonly DEFAULT_TOKEN_TTL_MIN = 15;

  constructor(
    private readonly userService: UserService,
    @InjectModel(PasswordResetToken.name)
    private readonly tokenModel: Model<PasswordResetTokenDocument>,
  ) {}

  async requestReset(emailOrPhone: string): Promise<void> {
    const user = await this.userService.findByEmailOrPhone(emailOrPhone);

    if (!user) {
      // Pour éviter de divulguer l’existence d’un compte, on se contente de tracer la demande
      this.logDispatch(emailOrPhone, null);
      return;
    }

    await this.tokenModel.deleteMany({ userId: user.id }).exec();

    const token = PasswordResetService.generateNumericToken();
    const expiresAt = new Date(Date.now() + PasswordResetService.DEFAULT_TOKEN_TTL_MIN * 60 * 1000);

    await this.tokenModel.create({
      token,
      userId: user.id,
      email: user.email,
      expiresAt,
    });

    this.logDispatch(user.email, token);
  }

  async confirmReset(token: string, newPassword: string): Promise<void> {
    const record = await this.tokenModel.findOne({ token }).exec();

    if (!record || record.expiresAt.getTime() < Date.now()) {
      if (record) {
        await record.deleteOne();
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.userService.setPassword(record.userId, newPassword);
    await this.tokenModel.deleteMany({ userId: record.userId }).exec();
  }

  private static generateNumericToken(): string {
    return Array.from({ length: 6 })
      .map(() => randomInt(0, 10))
      .join('');
  }

  private logDispatch(destination: string | null, token: string | null) {
    const address = destination ?? 'unknown-destination';
    const tokenPreview = token ?? 'issued-if-account-exists';
    // Stub mailer
    // eslint-disable-next-line no-console
    console.log('[PasswordReset]', { address, tokenPreview });
  }
}
