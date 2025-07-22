import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsultationModule } from './consultation/consultation.module';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { ChatModule } from './chat/chat.module';
import { VoiceModule } from './voice/voice.module';
import { VideoModule } from './video/video.module';
import { EventsModule } from './events/events.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ConsultationModule, ChatModule, VoiceModule, VideoModule, EventsModule, CommonModule],
  controllers: [AppController, ConsultationController],
  providers: [AppService, ConsultationService],
})
export class AppModule {}
