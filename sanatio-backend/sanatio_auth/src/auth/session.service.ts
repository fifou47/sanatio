import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';

import { Session, SessionDocument } from './schemas/session.schema';

interface SessionPayload {
  sessionId: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeen: string;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(userId: string, userAgent: string | null, ip: string | null): Promise<SessionPayload> {
    const sessionId = randomUUID();
    const created = await this.sessionModel.create({
      userId,
      sessionId,
      userAgent,
      ip,
      lastSeen: new Date(),
    });
    return this.mapSession(created);
  }

  async list(userId: string): Promise<SessionPayload[]> {
    const sessions = await this.sessionModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return sessions.map((session) => this.mapSession(session));
  }

  async terminate(userId: string, sessionId: string): Promise<void> {
    const res = await this.sessionModel.deleteOne({ userId, sessionId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async terminateAllForUser(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({ userId }).exec();
  }

  async terminateBySessionId(sessionId: string): Promise<void> {
    await this.sessionModel.deleteMany({ sessionId }).exec();
  }

  async touch(sessionId: string): Promise<void> {
    await this.sessionModel.updateMany({ sessionId }, { $set: { lastSeen: new Date() } }).exec();
  }

  private mapSession(session: Session): SessionPayload {
    const createdAt = (session as any).createdAt instanceof Date
      ? ((session as any).createdAt as Date).toISOString()
      : new Date().toISOString();
    const lastSeen = session.lastSeen instanceof Date ? session.lastSeen.toISOString() : new Date().toISOString();
    return {
      sessionId: session.sessionId,
      userAgent: session.userAgent ?? null,
      ip: session.ip ?? null,
      createdAt,
      lastSeen,
    };
  }
}
