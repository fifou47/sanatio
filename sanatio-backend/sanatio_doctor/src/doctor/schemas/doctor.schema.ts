import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Specialty' }], default: [] })
  specialties: Types.ObjectId[];

  @Prop({ required: true })
  baseRate: number;
}

export type DoctorDocument = Doctor & Document;
export const DoctorSchema = SchemaFactory.createForClass(Doctor);
