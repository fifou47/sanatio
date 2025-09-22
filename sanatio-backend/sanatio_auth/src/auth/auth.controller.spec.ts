import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { SessionService } from './session.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionService: jest.Mocked<SessionService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    sessionService = {
      list: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    userService = {
      findById: jest.fn(),
      setAutoLock: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PasswordResetService, useValue: { requestReset: jest.fn(), confirmReset: jest.fn() } },
        { provide: SessionService, useValue: sessionService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.login with context from request', async () => {
    const dto: LoginDto = { emailOrPhone: 'john', password: 'secret' } as any;
    authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', sessionId: 's' } as any);
    const req: any = { headers: { 'user-agent': 'TestAgent', 'x-forwarded-for': '1.1.1.1' }, ip: '2.2.2.2' };

    await controller.login(dto, req);

    expect(authService.login).toHaveBeenCalledWith(dto, {
      userAgent: 'TestAgent',
      ip: '1.1.1.1',
    });
  });

  it('should list sessions and attach auto lock state', async () => {
    sessionService.list.mockResolvedValue([{ sessionId: 's1', userAgent: null, ip: null, createdAt: '2023-01-01T00:00:00.000Z', lastSeen: '2023-01-01T00:00:00.000Z' }]);
    userService.findById.mockResolvedValue({ autoLockEnabled: true } as any);

    const result = await controller.listSessions({ user: { sub: 'user-1', sessionId: 's1', email: '', roles: [] } } as any);

    expect(result.autoLockEnabled).toBe(true);
    expect(result.sessions[0].isCurrent).toBe(true);
  });
});
