import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Bill {
  @Prop({ required: true })
  invoiceId: string;

  @Prop({ default: () => new Date() })
  date: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: string;
}

const BillSchema = SchemaFactory.createForClass(Bill);

@Schema()
export class BillingHistory {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: [BillSchema], default: [] })
  bills: Bill[];
}

// 👇 Ceci est essentiel pour avoir l'autocomplétion et le typage correct
export type BillingHistoryDocument = BillingHistory & Document;

export const BillingHistorySchema = SchemaFactory.createForClass(BillingHistory);
