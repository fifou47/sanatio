import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceService {
  startCall(consultationId: string) {
    // logique WebRTC / signalisation ici
    return { consultationId, started: true };
  }
}
