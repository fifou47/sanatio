import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,     // gère createdAt / updatedAt automatiquement
  versionKey: false,    // pas de __v
})
export class Session {
  @Prop({ type: String, required: true, unique: true, trim: true })
  sessionId!: string;

  // si tes users sont en ObjectId, tu pourras remplacer par Types.ObjectId + ref
  @Prop({ type: String, required: true, trim: true })
  userId!: string;

  @Prop({ type: String, default: null, trim: true })
  userAgent?: string | null;

  @Prop({ type: String, default: null, trim: true })
  ip!: string | null;

  @Prop({ type: Date, default: Date.now })
  lastSeen!: Date;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);

// Index utiles et simples
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ userId: 1 });
