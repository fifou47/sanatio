import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    ClientsModule.registerAsync([
      {
        name: 'EVENT_BUS',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const url = config.get<string>('REDIS_URL');
          if (!url) {
            throw new Error('REDIS_URL must be defined');
          }
          return {
            transport: Transport.REDIS,
            options: {
              url,
              retryAttempts: config.get<number>('REDIS_RETRY_ATTEMPTS', 5),
              retryDelay: config.get<number>('REDIS_RETRY_DELAY', 3000),
            },
          };
        },
      },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
