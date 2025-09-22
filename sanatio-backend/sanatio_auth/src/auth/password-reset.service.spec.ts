import { UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';

import { PasswordResetService } from './password-reset.service';
import { UserService } from '../user/user.service';
import { PasswordResetTokenDocument } from './schemas/password-reset-token.schema';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let userService: jest.Mocked<UserService>;
  let tokenModel: jest.Mocked<Model<PasswordResetTokenDocument>>;

  beforeEach(() => {
    userService = {
      findByEmailOrPhone: jest.fn(),
      setPassword: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    tokenModel = {
      deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
      create: jest.fn(),
      findOne: jest.fn(),
      deleteOne: jest.fn(),
    } as unknown as jest.Mocked<Model<PasswordResetTokenDocument>>;

    service = new PasswordResetService(userService, tokenModel);
  });

  it('should request reset when user exists', async () => {
    userService.findByEmailOrPhone.mockResolvedValue({ id: 'user-1', email: 'user@email.test' } as any);
    tokenModel.create.mockResolvedValue({} as any);

    await expect(service.requestReset('user@email.test')).resolves.toBeUndefined();

    expect(tokenModel.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(tokenModel.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });

  it('should silently succeed when user does not exist', async () => {
    userService.findByEmailOrPhone.mockResolvedValue(null);

    await expect(service.requestReset('ghost')).resolves.toBeUndefined();
    expect(tokenModel.create).not.toHaveBeenCalled();
  });

  it('should throw on invalid token', async () => {
    tokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);

    await expect(service.confirmReset('bad', 'Password123')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
