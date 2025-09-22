import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SessionService } from './session.service';
import { Session, SessionDocument } from './schemas/session.schema';

describe('SessionService', () => {
  let service: SessionService;
  let model: jest.Mocked<Model<SessionDocument>>;

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    } as unknown as jest.Mocked<Model<SessionDocument>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: getModelToken(Session.name), useValue: model },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('creates a session and returns payload', async () => {
    const session = {
      sessionId: 'session-1',
      userId: 'user-1',
      userAgent: 'UA',
      ip: '127.0.0.1',
      lastSeen: new Date(),
      createdAt: new Date(),
    } as Session;
    model.create.mockResolvedValue(session as any);

    const payload = await service.create('user-1', 'UA', '127.0.0.1');

    expect(payload.sessionId).toBe('session-1');
    expect(model.create).toHaveBeenCalled();
  });

  it('lists sessions sorted by creation date', async () => {
    const now = new Date();
    model.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([
        {
          sessionId: 's1',
          userAgent: null,
          ip: null,
          createdAt: now,
          lastSeen: now,
        },
      ]) }),
    } as any);

    const sessions = await service.list('user-1');
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe('s1');
  });
});
