import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) sessionId: string;
  @Prop({ required: true }) tokenHash: string;
  @Prop({ required: true }) expiresAt: Date;
}

export type RefreshTokenDocument = RefreshToken & Document;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
RefreshTokenSchema.index({ sessionId: 1 });
