import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AvailabilitySlot, AvailabilitySlotDocument } from './schemas/availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

interface Consultation {
  startTime: string;
  endTime: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
}

@Injectable()
export class AvailabilityService {
  private readonly consultationSvcUrl = 'http://sanatio-consultation:3000';

  constructor(
    @InjectModel(AvailabilitySlot.name)
    private slotModel: Model<AvailabilitySlotDocument>,
    private http: HttpService,
  ) {}

  async getAvailableTimeSlots(doctorId: string, from: Date, consultationDuration = 30): Promise<TimeSlot[]> {
    const doctorObjectId = new Types.ObjectId(doctorId);
    const availabilitySlots = await this.slotModel.find({
      doctorId: doctorObjectId,
      start: { $gte: from },
    }).sort({ start: 'asc' });

    if (!availabilitySlots.length) return [];

    const rangeStart = availabilitySlots[0].start;
    const rangeEnd = availabilitySlots[availabilitySlots.length - 1].end;

    // Fetch booked consultations
    const bookedConsultations = await this._fetchBookedConsultations(doctorId, rangeStart, rangeEnd);

    const availableSlots: TimeSlot[] = [];

    for (const slot of availabilitySlots) {
      let currentPointer = new Date(slot.start);

      while (currentPointer < slot.end) {
        const potentialSlotEnd = new Date(currentPointer.getTime() + consultationDuration * 60000);

        if (potentialSlotEnd > slot.end) break;

        const isBooked = bookedConsultations.some(
          c => new Date(c.startTime) < potentialSlotEnd && new Date(c.endTime) > currentPointer
        );

        if (!isBooked) {
          availableSlots.push({ start: new Date(currentPointer), end: potentialSlotEnd });
        }

        currentPointer = potentialSlotEnd;
      }
    }

    return availableSlots;
  }

  private async _fetchBookedConsultations(doctorId: string, from: Date, to: Date): Promise<Consultation[]> {
    try {
      const url = `${this.consultationSvcUrl}/consultations/doctor/${doctorId}?from=${from.toISOString()}&to=${to.toISOString()}`;
      const response = await firstValueFrom(this.http.get<Consultation[]>(url));
      return response.data;
    } catch (error) {
      // Gérer l'erreur, par exemple, logger et retourner un tableau vide
      console.error('Error fetching consultations:', error.message);
      return [];
    }
  }

  async create(doctorId: string, dto: CreateAvailabilityDto) {
    const slot = new this.slotModel({
      doctorId: new Types.ObjectId(doctorId),
      start: new Date(dto.start),
      end: new Date(dto.end),
    });
    return slot.save();
  }

  async findAll(doctorId: string) {
    return this.slotModel
      .find({ doctorId: new Types.ObjectId(doctorId) })
      .exec();
  }

  async remove(doctorId: string, slotId: string) {
    const res = await this.slotModel.deleteOne({
      _id: slotId,
      doctorId: new Types.ObjectId(doctorId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Slot not found');
  }
}
