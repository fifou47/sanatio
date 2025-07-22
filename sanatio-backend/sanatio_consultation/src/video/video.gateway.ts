import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { VideoService } from './video.service';

@WebSocketGateway({ namespace: '/video' })
export class VideoGateway {
  constructor(private svc: VideoService) {}

  @SubscribeMessage('startVideo')
  handleStartVideo(client: any, payload: { consultationId: string }) {
    return this.svc.startVideo(payload.consultationId);
  }
}
