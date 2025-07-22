import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { SpecialtyModule } from '../specialty/specialty.module';
import { Doctor, DoctorSchema } from './schemas/doctor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),
    NestHttpModule,
    SpecialtyModule,  // pour valider/reférer specialties
  ],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}
