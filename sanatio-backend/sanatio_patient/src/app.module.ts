import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PatientModule } from './patient/patient.module';
import { BillingHistoryModule } from './billing-history/billing-history.module';
import { RatingModule } from './rating/rating.module';
import configuration from './configuration';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL || 60),
          limit: Number(process.env.RATE_LIMIT || 60),
        },
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ||
          config.get<string>('MONGO_URI') ||
          process.env.MONGODB_URI ||
          process.env.MONGO_URI ||
          'mongodb://localhost:27017/sanatio_patient',
      }),
      inject: [ConfigService],
    }),
    PatientModule,
    BillingHistoryModule,
    RatingModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
