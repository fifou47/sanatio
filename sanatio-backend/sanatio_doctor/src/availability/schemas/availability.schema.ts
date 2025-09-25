import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AvailabilitySlot {
  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

}

export type AvailabilitySlotDocument = AvailabilitySlot & Document;
export const AvailabilitySlotSchema = SchemaFactory.createForClass(AvailabilitySlot);
