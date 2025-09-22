import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ConsultationType { CHAT='CHAT', VOICE='VOICE', VIDEO='VIDEO' }
export enum ConsultationStatus { SCHEDULED='SCHEDULED', ONGOING='ONGOING', COMPLETED='COMPLETED', CANCELED='CANCELED', NO_SHOW='NO_SHOW' }

@Schema({ _id: false })
export class DocumentMeta {
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) type: string;
  @Prop({ default: Date.now }) dateUpload: Date;
}

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor', required: true })
  doctorId: Types.ObjectId;

  // Optionnel: liens avec l’ID utilisateur Auth pour contrôle d’accès WS
  @Prop() patientUserId?: string;
  @Prop() doctorUserId?: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  duration: number; // en minutes

  // Stocker la fin pour requêtes plus simples
  @Prop({ required: true })
  endTime: Date;

  @Prop({ enum: ConsultationType, required: true })
  type: ConsultationType;

  @Prop({ enum: ConsultationStatus, default: ConsultationStatus.SCHEDULED })
  status: ConsultationStatus;

  @Prop()
  fee: number;

  // Motif, notes et pièces jointes
  @Prop() reason?: string;
  @Prop() notesDoctor?: string;
  @Prop() notesPatient?: string;
  @Prop({ type: [DocumentMeta], default: [] }) attachments?: DocumentMeta[];

  // Annulation / suivi
  @Prop() cancellationReason?: string;
  @Prop() followUpAt?: Date;

  // Salle de consultation / groupe
  @Prop({ unique: true, sparse: true }) roomId?: string;
  @Prop({ unique: true, sparse: true }) joinCode?: string;
  @Prop({ default: false }) isGroup?: boolean;
  @Prop({ type: [String], default: [] }) additionalUserIds?: string[]; // autres participants (Auth user ids)
  @Prop({ default: 2 }) maxParticipants?: number;
}

export type ConsultationDocument = Consultation & Document;
export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
ConsultationSchema.index({ doctorId: 1, startTime: 1 });
ConsultationSchema.index({ patientId: 1, startTime: 1 });
ConsultationSchema.index({ status: 1 });
