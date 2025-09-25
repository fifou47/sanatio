import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { Consultation, ConsultationSchema } from './schemas/consultation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Consultation.name, schema: ConsultationSchema }]),
    ConfigModule,
  ],
  providers: [ConsultationService],
  controllers: [ConsultationController],
  exports: [ConsultationService],
})
export class ConsultationModule {}
