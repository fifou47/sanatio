import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialtyService } from './specialty.service';
import { SpecialtyController } from './specialty.controller';
import { Specialty, SpecialtySchema } from './schemas/specialty.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Specialty.name, schema: SpecialtySchema }])
  ],
  providers: [SpecialtyService],
  controllers: [SpecialtyController],
  exports: [SpecialtyService],
})
export class SpecialtyModule {}
