import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Consultation', required: true })
  consultationId: Types.ObjectId;

  @Prop({ required: true }) senderId: string;
  @Prop() content?: string;
  @Prop({
    type: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
        mime: { type: String, required: true },
      },
    ],
    default: [],
  })
  attachments: { url: string; name: string; size: number; mime: string }[];
  @Prop() timestamp: Date;
}

export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ consultationId: 1, createdAt: -1 });
