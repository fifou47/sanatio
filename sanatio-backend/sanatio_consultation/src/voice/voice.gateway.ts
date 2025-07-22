import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { VoiceService } from './voice.service';

@WebSocketGateway({ namespace: '/voice' })
export class VoiceGateway {
  constructor(private svc: VoiceService) {}

  @SubscribeMessage('startCall')
  handleStartCall(client: any, payload: { consultationId: string }) {
    return this.svc.startCall(payload.consultationId);
  }
}
