import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConsultationEvents } from './consultation.events/consultation.events';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [ConsultationEvents],
  exports: [],
})
export class EventsModule {}
