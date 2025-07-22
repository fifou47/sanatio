import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private msgModel: Model<MessageDocument>) {}

  async handleMessage(dto: SendMessageDto) {
    const msg = new this.msgModel({ ...dto, timestamp: new Date() });
    return msg.save();
  }
}
