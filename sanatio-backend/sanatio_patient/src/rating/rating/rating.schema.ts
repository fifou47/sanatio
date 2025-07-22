import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment: string;

  @Prop({ default: () => new Date() })
  date: Date;
}

export type RatingDocument = Rating & Document;
export const RatingSchema = SchemaFactory.createForClass(Rating);
