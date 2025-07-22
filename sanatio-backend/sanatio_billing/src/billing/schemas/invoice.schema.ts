import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type InvoiceDocument = Invoice & Document;

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID    = 'PAID',
  FAILED  = 'FAILED',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: String, default: uuidv4, unique: true })
  invoiceId: string;


  @Prop({ type: String, required: true })
  consultationId: string;

  @Prop({ type: String, required: true })
  patientId: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
