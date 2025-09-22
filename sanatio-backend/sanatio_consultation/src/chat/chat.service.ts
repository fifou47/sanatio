import { BadRequestException, Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto/send-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private msgModel: Model<MessageDocument>) {}

  async handleMessage(dto: SendMessageDto) {
    const hasContent = Boolean(dto.content && dto.content.trim());
    const hasAttachments = Array.isArray(dto.attachments) && dto.attachments.length > 0;
    if (!hasContent && !hasAttachments) {
      throw new BadRequestException('Message must have content or attachments');
    }
    const msg = new this.msgModel({
      ...dto,
      attachments: dto.attachments || [],
      timestamp: new Date(),
    });
    return msg.save();
  }

  async list(consultationId: string, page = 1, limit = 20) {
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      this.msgModel
        .find({ consultationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean()
        .exec(),
      this.msgModel.countDocuments({ consultationId }).exec(),
    ]);
    return { items, page: p, limit: l, total, totalPages: Math.ceil(total / l) };
  }

  async getById(id: string) {
    return this.msgModel.findById(id).exec();
  }
}
