import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ _id: false })
export class DocumentMeta {
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) type: string;
  @Prop({ default: Date.now }) dateUpload: Date;
}

@Schema({ _id: false })
export class Address {
  @Prop() line1: string;
  @Prop() line2?: string;
  @Prop() city?: string;
  @Prop() region?: string;
  @Prop() postalCode?: string;
  @Prop() country?: string;
}

@Schema({ _id: false })
export class EmergencyContact {
  @Prop() name: string;
  @Prop() relation?: string;
  @Prop() phone?: string;
}

@Schema()
export class Patient extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ unique: true, sparse: true }) phone: string;
  @Prop() insuranceNumber: string;
  @Prop([String]) medicalHistory: string[];
  @Prop([String]) allergies: string[];
  @Prop([String]) currentTreatments: string[];
  @Prop([DocumentMeta]) documents: DocumentMeta[];

  @Prop({ enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: false })
  bloodGroup?: string;
  @Prop() gender?: 'M' | 'F' | 'O';
  @Prop() dateOfBirth?: Date;
  @Prop({ type: Address }) address?: Address;
  @Prop({ type: EmergencyContact }) emergencyContact?: EmergencyContact;
  @Prop([String]) languages?: string[]; // e.g. ['fr','en']
  @Prop() occupation?: string;
  @Prop() nationality?: string;
  @Prop() placeOfBirth?: string;
  @Prop() maritalStatus?: string;
  @Prop() heightCm?: number;
  @Prop() weightKg?: number;
  @Prop({ default: false }) smoker?: boolean;
  @Prop({ default: false }) alcoholUse?: boolean;
  @Prop() notes?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.index({ email: 1 }, { unique: true });
PatientSchema.index({ phone: 1 }, { unique: true, sparse: true });
