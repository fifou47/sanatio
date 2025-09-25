import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessToken } from 'livekit-server-sdk';
import { Consultation, ConsultationDocument } from './schemas/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

interface TimeSlot {
  start: string;
  end: string;
}

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectModel(Consultation.name) private consModel: Model<ConsultationDocument>,
    private events: EventEmitter2,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateConsultationDto) {
    const start = new Date(dto.startTime);
    const end = new Date(start.getTime() + dto.duration * 60000);

    // La vérification de la disponibilité est désormais de la responsabilité du client.
    // Nous ne gardons que la vérification de conflit pour éviter les race conditions.
    const overlap = await this.consModel.exists({
      doctorId: dto.doctorId,
      $expr: {
        $and: [
          { $lt: ['$startTime', end] },
          { $gt: [{ $add: ['$startTime', { $multiply: ['$duration', 60000] }] }, start] },
        ],
      },
      status: { $in: ['SCHEDULED', 'ONGOING'] },
    });
    if (overlap) throw new BadRequestException('Doctor already booked for this time range');

    const fee = dto.duration * 2; // TODO: intégrer logique tarifaire avancée
    const doc = new this.consModel({
      ...dto,
      startTime: start,
      endTime: end,
      fee,
      isGroup: dto.isGroup ?? false,
      additionalUserIds: dto.additionalUserIds || [],
      reason: dto.reason,
    });
    const saved = await doc.save();
    this.events.emit('consultation.scheduled', saved);
    return saved;
  }

  async findAll() { return this.consModel.find().exec(); }

  async findAllForDoctor(doctorId: string, from?: Date, to?: Date) {
    const query: any = { doctorId };
    if (from || to) {
      query.startTime = {};
      if (from) query.startTime.$gte = from;
      if (to) query.startTime.$lte = to;
    }
    return this.consModel.find(query).exec();
  }

  async findOne(id: string) {
    const c = await this.consModel.findById(id);
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  async update(id: string, dto: UpdateConsultationDto) {
    // si on change start/duration, recalculer endTime et checker conflit
    if (dto.startTime || dto.duration) {
      const current = await this.consModel.findById(id);
      if (!current) throw new NotFoundException('Consultation not found');
      const start = dto.startTime ? new Date(dto.startTime as any) : current.startTime;
      const duration = dto.duration ?? current.duration;
      const end = new Date(new Date(start).getTime() + duration * 60000);
      const conflict = await this.consModel.exists({
        _id: { $ne: id },
        doctorId: dto.doctorId ?? current.doctorId,
        $expr: {
          $and: [
            { $lt: ['$startTime', end] },
            { $gt: [{ $add: ['$startTime', { $multiply: ['$duration', 60000] }] }, start] },
          ],
        },
        status: { $in: ['SCHEDULED', 'ONGOING'] },
      });
      if (conflict) throw new BadRequestException('Doctor already booked for this time range');
      (dto as any).endTime = end;
    }
    const c = await this.consModel.findByIdAndUpdate(id, dto, { new: true });
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  async changeStatus(id: string, dto: ChangeStatusDto) {
    const c = await this.consModel.findById(id);
    if (!c) throw new NotFoundException('Consultation not found');
    c.status = dto.status;
    if (dto.status === 'CANCELED' && (dto as any).cancellationReason) {
      (c as any).cancellationReason = (dto as any).cancellationReason;
    }
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

  async generateJoinToken(consultationId: string, userId: string) {
    const consultation = await this.consModel.findById(consultationId);
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    // Vérifier si l'utilisateur a le droit de rejoindre la consultation
    const isPatient = consultation.patientUserId === userId;
    const isDoctor = consultation.doctorUserId === userId;
    const isAdditionalUser = !!consultation.additionalUserIds?.includes(userId);
    if (!isPatient && !isDoctor && !isAdditionalUser) {
      throw new ForbiddenException('You are not authorized to join this consultation');
    }

    const roomName = consultationId;
    const participantName = userId; // Ou un nom d'utilisateur plus descriptif

    const livekitApiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const livekitApiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');
    const livekitHost = this.configService.get<string>('LIVEKIT_HOST');

    if (!livekitApiKey || !livekitApiSecret || !livekitHost) {
      throw new Error('LiveKit configuration is missing');
    }

    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return { token: at.toJwt() };
  }
}