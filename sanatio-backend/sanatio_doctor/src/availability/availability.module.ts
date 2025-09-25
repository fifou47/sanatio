import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilitySlot, AvailabilitySlotSchema } from './schemas/availability.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AvailabilitySlot.name, schema: AvailabilitySlotSchema },
    ]),
    HttpModule,
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
