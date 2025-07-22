import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED  = 'FAILED',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: String, default: uuidv4, unique: true })
  paymentId: string;

  @Prop({ type: String, required: true })
  invoiceId: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  method: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.SUCCESS })
  status: PaymentStatus;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
