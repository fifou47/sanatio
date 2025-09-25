// src/doctor/schemas/doctor.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' }) type: 'Point';
  @Prop({ type: [Number] }) coordinates: [number, number]; // [lng, lat]
}

@Schema({ _id: false })
export class ClinicAddress {
  @Prop() line1?: string;
  @Prop() line2?: string;
  @Prop() city?: string;
  @Prop() region?: string;
  @Prop() postalCode?: string;
  @Prop() country?: string;
  @Prop({ type: GeoPoint }) location?: GeoPoint;
}

@Schema({ _id: false })
export class EducationEntry {
  @Prop() institution?: string;
  @Prop() degree?: string;
  @Prop() year?: number;
}

// 🔹 Appellations usuelles (préfixe d’affichage)
export type ProfessionalTitle =
  | 'DR'            // Médecin / Chirurgien / Dentiste
  | 'PR'            // Professeur
  | 'PR_DR'         // Professeur, Docteur
  | 'INF'           // Infirmier(ère) (abrév. usuelle)
  | 'IDE'           // Infirmier(ère) Diplômé(e) d’État
  | 'IADE'          // Infirmier(ère) Anesthésiste
  | 'IBODE'         // Infirmier(ère) Bloc Opératoire
  | 'SF'            // Sage-femme
  | 'PHARM'         // Pharmacien(ne)
  | 'KINE'          // Kinésithérapeute
  | 'PSY'           // Psychologue
  | 'DIET'          // Diététicien(ne)
  | 'ERGO'          // Ergothérapeute
  | 'ORTOPT'        // Orthoptiste
  | 'AUDIOPROTH'    // Audioprothésiste
  | 'TECH'          // Technicien(ne) (radio/labo…)
  | 'AUTRE';

@Schema({ timestamps: true })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true }) firstName: string;
  @Prop({ required: true, trim: true }) lastName: string;

  // 🔹 Nouveau: appellation affichée (préfixe)
  @Prop({
    enum: ['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'],
    default: 'DR'
  })
  title?: ProfessionalTitle;

  // 🔹 Photo optionnelle
  @Prop() profilePhotoUrl?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Specialty' }], default: [] })
  specialties: Types.ObjectId[];

  @Prop({ required: true, min: 0 })
  baseRate: number;

  @Prop([String]) languages?: string[];
  @Prop() bio?: string;
  @Prop({ type: [EducationEntry], default: [] }) education?: EducationEntry[];
  @Prop({ type: [String], default: [] }) certifications?: string[];
  @Prop({ unique: true, sparse: true }) registrationNumber?: string;
  @Prop({ default: 0 }) ratingAverage?: number;
  @Prop({ default: 0 }) ratingCount?: number;
  @Prop({ default: false }) acceptsInsurance?: boolean;
  @Prop({ default: true }) isTelemedicine?: boolean;
  @Prop({ enum: ['ONSITE','REMOTE','BOTH'], default: 'BOTH' }) availabilityMode?: 'ONSITE'|'REMOTE'|'BOTH';
  @Prop({ type: [ClinicAddress], default: [] }) clinicAddresses?: ClinicAddress[];
}

export type DoctorDocument = Doctor & Document;
export const DoctorSchema = SchemaFactory.createForClass(Doctor);

// Index
DoctorSchema.index({ specialties: 1 });
DoctorSchema.index({ languages: 1 });
DoctorSchema.index({ registrationNumber: 1 }, { unique: true, sparse: true });
DoctorSchema
