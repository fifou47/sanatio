import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AvailabilitySlot, AvailabilitySlotDocument } from './schemas/availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { BookAvailabilityDto } from './dto/update-availability.dto';



@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(AvailabilitySlot.name)
    private slotModel: Model<AvailabilitySlotDocument>,
  ) {}

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

  async book(doctorId: string, slotId: string, dto: BookAvailabilityDto) {
    const slot = await this.slotModel.findOne({
      _id: slotId,
      doctorId: new Types.ObjectId(doctorId),
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');
    slot.isBooked = true;
    // On pourrait ajouter patientId field, mais simplifions
    return slot.save();
  }

  async remove(doctorId: string, slotId: string) {
    const res = await this.slotModel.deleteOne({
      _id: slotId,
      doctorId: new Types.ObjectId(doctorId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Slot not found');
  }
}
