import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Consultation, ConsultationDocument } from './schemas/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectModel(Consultation.name) private consModel: Model<ConsultationDocument>,
    private events: EventEmitter2,
  ) {}

  async create(dto: CreateConsultationDto) {
    // calcul initial du fee (exemple simple : duration * rate)
    const fee = dto.duration * 2; 
    const doc = new this.consModel({ 
      ...dto, 
      startTime: new Date(dto.startTime), 
      fee 
    });
    const saved = await doc.save();
    this.events.emit('consultation.scheduled', saved);
    return saved;
  }

  async findAll() { return this.consModel.find().exec(); }
  async findOne(id: string) {
    const c = await this.consModel.findById(id);
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  async update(id: string, dto: UpdateConsultationDto) {
    const c = await this.consModel.findByIdAndUpdate(id, dto, { new: true });
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  async changeStatus(id: string, dto: ChangeStatusDto) {
    const c = await this.consModel.findById(id);
    if (!c) throw new NotFoundException('Consultation not found');
    c.status = dto.status;
    await c.save();
    this.events.emit(
      `consultation.${dto.status.toLowerCase()}`, 
      c
    );
    return c;
  }

  async remove(id: string) {
    const res = await this.consModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Consultation not found');
  }
}
