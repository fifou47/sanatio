import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingHistoryController } from './billing-history.controller';
import { BillingHistoryService } from './billing-history.service';
import { BillingHistory, BillingHistorySchema } from './billing-history.schema/billing-history.schema';


@Module({
  imports: [MongooseModule.forFeature([{ name: BillingHistory.name, schema: BillingHistorySchema }])],
  controllers: [BillingHistoryController],
  providers: [BillingHistoryService],
  exports: [BillingHistoryService],
})
export class BillingHistoryModule {}
