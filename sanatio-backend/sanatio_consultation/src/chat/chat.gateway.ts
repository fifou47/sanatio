import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';

type JoinPayload = { consultationId: string };
type TypingPayload = { consultationId: string; typing: boolean };
type ReadPayload = { consultationId: string; messageId: string };

@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: (process.env.WS_ALLOWED_ORIGINS || '*').split(','), credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;
  private logger = new Logger('ChatGateway');
  private rooms = new Map<string, Set<string>>();

  constructor(private cfg: ConfigService, private chat: ChatService) {}

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
      const payload = jwt.verify(token, this.cfg.get<string>('JWT_SECRET') as string) as any;
      (client as any).user = { sub: payload.sub, email: payload.email, roles: payload.roles || [] };
    } catch (e: any) {
      this.logger.warn(`WS chat auth failed: ${e?.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [room, members] of this.rooms.entries()) {
      if (members.delete(client.id)) {
        client.to(room).emit('peer-left', { socketId: client.id });
        if (!members.size) this.rooms.delete(room);
      }
    }
  }

  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() client: Socket, @MessageBody() p: JoinPayload) {
    if (this.isPayloadTooLarge(p)) return;
    if (!p?.consultationId) return;
    if (!this.rooms.has(p.consultationId)) this.rooms.set(p.consultationId, new Set());
    this.rooms.get(p.consultationId)!.add(client.id);
    client.join(p.consultationId);
    client.to(p.consultationId).emit('peer-joined', { socketId: client.id });
    const others = Array.from(this.rooms.get(p.consultationId)!).filter((id) => id !== client.id);
    client.emit('peers', { peers: others });
  }

  @SubscribeMessage('message')
  async onMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    if (this.isPayloadTooLarge(dto)) return;
    const saved = await this.chat.handleMessage(dto);
    this.io.to(String(dto.consultationId)).emit('message', saved);
    return saved;
  }

  @SubscribeMessage('typing')
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() p: TypingPayload) {
    if (this.isPayloadTooLarge(p)) return;
    if (!p?.consultationId) return;
    client.to(p.consultationId).emit('typing', { socketId: client.id, typing: p.typing });
  }

  @SubscribeMessage('read')
  onRead(@ConnectedSocket() client: Socket, @MessageBody() p: ReadPayload) {
    if (this.isPayloadTooLarge(p)) return;
    if (!p?.consultationId || !p?.messageId) return;
    client.to(p.consultationId).emit('read', { socketId: client.id, messageId: p.messageId });
  }

  @SubscribeMessage('leave')
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() p: JoinPayload) {
    if (this.isPayloadTooLarge(p)) return;
    if (!p?.consultationId) return;
    client.leave(p.consultationId);
    const members = this.rooms.get(p.consultationId);
    if (members?.delete(client.id)) client.to(p.consultationId).emit('peer-left', { socketId: client.id });
    if (members && !members.size) this.rooms.delete(p.consultationId);
  }
}
