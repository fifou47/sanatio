import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorModule } from './doctor/doctor.module';
import { SpecialtyModule } from './specialty/specialty.module';
import { AvailabilityModule } from './availability/availability.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL || 60),
          limit: Number(process.env.RATE_LIMIT || 60),
        },
      ],
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/sanatio_doctor',
    ),
    DoctorModule,
    SpecialtyModule,
    AvailabilityModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
