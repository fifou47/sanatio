import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoService {
  startVideo(consultationId: string) {
    // logique WebRTC / signalisation ici
    return { consultationId, conferenceLink: `wss://video/${consultationId}` };
  }
}
