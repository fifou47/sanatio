import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ConsultationType { CHAT='CHAT', VOICE='VOICE', VIDEO='VIDEO' }
export enum ConsultationStatus { SCHEDULED='SCHEDULED', ONGOING='ONGOING', COMPLETED='COMPLETED', CANCELED='CANCELED' }

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  duration: number; // en minutes

  @Prop({ enum: ConsultationType, required: true })
  type: ConsultationType;

  @Prop({ enum: ConsultationStatus, default: ConsultationStatus.SCHEDULED })
  status: ConsultationStatus;

  @Prop()
  fee: number;
}

export type ConsultationDocument = Consultation & Document;
export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
