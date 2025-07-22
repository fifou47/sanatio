import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  constructor(private svc: ChatService) {}

  @SubscribeMessage('message')
  async onMessage(@MessageBody() dto: SendMessageDto) {
    return this.svc.handleMessage(dto);
  }
}
