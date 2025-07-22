import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Specialty {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;
}

export type SpecialtyDocument = Specialty & Document;
export const SpecialtySchema = SchemaFactory.createForClass(Specialty);
