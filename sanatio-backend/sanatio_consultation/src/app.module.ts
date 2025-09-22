import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsultationModule } from './consultation/consultation.module';
import { ConsultationController } from './consultation/consultation.controller';
import { ConsultationService } from './consultation/consultation.service';
import { ChatModule } from './chat/chat.module';
import { VoiceModule } from './voice/voice.module';
import { VideoModule } from './video/video.module';
import { EventsModule } from './events/events.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/sanatio',
    ),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL || 60),
          limit: Number(process.env.RATE_LIMIT || 60),
        },
      ],
    }),
    ConsultationModule,
    ChatModule,
    VoiceModule,
    VideoModule,
    EventsModule,
    FilesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
