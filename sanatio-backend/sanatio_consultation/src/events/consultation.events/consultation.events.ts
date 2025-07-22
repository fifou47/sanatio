import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsultationEvents {
  @OnEvent('consultation.scheduled')
  handleScheduled(payload: any) {
    console.log('Consultation scheduled:', payload);
    // notifier NotificationService …  
  }
  @OnEvent('consultation.ongoing')
  handleStarted(payload: any) {
    console.log('Consultation started:', payload);
  }
  @OnEvent('consultation.completed')
  handleCompleted(payload: any) {
    console.log('Consultation completed:', payload);
  }
}
