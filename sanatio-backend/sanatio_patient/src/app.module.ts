import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientModule } from './patient/patient.module';
import { BillingHistoryModule } from './billing-history/billing-history.module';
import { RatingModule } from './rating/rating.module';
import configuration from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    PatientModule,
    BillingHistoryModule,
    RatingModule,
  ],
})
export class AppModule {}
