import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Role' }],
    default: () => [new Types.ObjectId('68d175acc9b49865d52981e1')],
  })
  roles: Types.ObjectId[];

  @Prop({ default: false })
  autoLockEnabled: boolean;
}
// schema User

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ id: 1 }, { unique: true, sparse: true });

