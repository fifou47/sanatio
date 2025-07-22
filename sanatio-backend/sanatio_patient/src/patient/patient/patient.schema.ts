import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema()
export class DocumentMeta {
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) type: string;
  @Prop({ default: Date.now }) dateUpload: Date;
}

@Schema({ _id: false })
export class Patient extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop() phone: string;
  @Prop() insuranceNumber: string;
  @Prop([String]) medicalHistory: string[];
  @Prop([String]) allergies: string[];
  @Prop([String]) currentTreatments: string[];
  @Prop([DocumentMeta]) documents: DocumentMeta[];
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
