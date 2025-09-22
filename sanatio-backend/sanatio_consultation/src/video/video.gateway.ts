import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type JoinPayload = { consultationId: string };
type SignalPayload = { consultationId: string; sdp?: any; candidate?: any; from?: string; to?: string };

@Injectable()
@WebSocketGateway({
  namespace: '/video',
  cors: {
    origin: (process.env.WS_ALLOWED_ORIGINS || '*').split(','),
    credentials: true,
  },
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;
  private logger = new Logger('VideoGateway');
  private rooms = new Map<string, Set<string>>(); // consultationId -> socketIds

  constructor(private readonly config: ConfigService) {}
  private isPayloadTooLarge(payload: unknown): boolean {
    const max = Number(process.env.MAX_WS_PAYLOAD || 65536); // 64KB
    try {
      const size = Buffer.byteLength(JSON.stringify(payload || {}), 'utf8');
      return size > max;
    } catch {
      return true;
    }
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake as any)?.auth?.token ||
        (client.handshake?.headers?.authorization as string | undefined)?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');
      const payload = jwt.verify(token, this.config.get<string>('JWT_SECRET') as string) as any;
      // attach minimal profile on socket
      (client as any).user = { sub: payload.sub, email: payload.email, roles: payload.roles || [] };
      this.logger.log(`WS connected: ${client.id} user=${payload.sub}`);
    } catch (e: any) {
      this.logger.warn(`WS auth failed: ${e?.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [room, members] of this.rooms.entries()) {
      if (members.delete(client.id)) {
        client.to(room).emit('peer-left', { socketId: client.id });
        if (members.size === 0) this.rooms.delete(room);
      }
    }
    this.logger.log(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload) {
    if (this.isPayloadTooLarge(payload)) return;
    const { consultationId } = payload || ({} as JoinPayload);
    if (!consultationId) return;
    if (!this.rooms.has(consultationId)) this.rooms.set(consultationId, new Set());
    this.rooms.get(consultationId)!.add(client.id);
    client.join(consultationId);
    // inform other peers
    client.to(consultationId).emit('peer-joined', { socketId: client.id });
    // send peers list to the newcomer
    const others = Array.from(this.rooms.get(consultationId)!).filter((id) => id !== client.id);
    client.emit('peers', { peers: others });
  }

  @SubscribeMessage('offer')
  onOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: SignalPayload) {
    if (this.isPayloadTooLarge(payload)) return;
    const { consultationId, sdp, to } = payload || ({} as SignalPayload);
    if (!consultationId || !sdp || !to) return;
    this.io.to(to).emit('offer', { from: client.id, sdp, consultationId });
  }

  @SubscribeMessage('answer')
  onAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: SignalPayload) {
    if (this.isPayloadTooLarge(payload)) return;
    const { consultationId, sdp, to } = payload || ({} as SignalPayload);
    if (!consultationId || !sdp || !to) return;
    this.io.to(to).emit('answer', { from: client.id, sdp, consultationId });
  }

  @SubscribeMessage('ice-candidate')
  onIce(@ConnectedSocket() client: Socket, @MessageBody() payload: SignalPayload) {
    if (this.isPayloadTooLarge(payload)) return;
    const { consultationId, candidate, to } = payload || ({} as SignalPayload);
    if (!consultationId || !candidate || !to) return;
    this.io.to(to).emit('ice-candidate', { from: client.id, candidate, consultationId });
  }

  @SubscribeMessage('leave')
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload) {
    if (this.isPayloadTooLarge(payload)) return;
    const { consultationId } = payload || ({} as JoinPayload);
    if (!consultationId) return;
    client.leave(consultationId);
    const members = this.rooms.get(consultationId);
    if (members?.delete(client.id)) client.to(consultationId).emit('peer-left', { socketId: client.id });
    if (members && members.size === 0) this.rooms.delete(consultationId);
  }
}
