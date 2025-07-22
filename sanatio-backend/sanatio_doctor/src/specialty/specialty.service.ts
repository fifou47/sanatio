import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { Specialty, SpecialtyDocument } from './schemas/specialty.schema';

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectModel(Specialty.name) 
    private specialtyModel: Model<SpecialtyDocument>
  ) {}

  async create(dto: CreateSpecialtyDto): Promise<Specialty> {
    return new this.specialtyModel(dto).save();
  }

  async findAll(): Promise<Specialty[]> {
    return this.specialtyModel.find().exec();
  }

  async findById(id: string): Promise<Specialty> {
    const sp = await this.specialtyModel.findById(id);
    if (!sp) throw new NotFoundException('Specialty not found');
    return sp;
  }

  async update(id: string, dto: UpdateSpecialtyDto): Promise<Specialty> {
    const sp = await this.specialtyModel.findByIdAndUpdate(id, dto, { new: true });
    if (!sp) throw new NotFoundException('Specialty not found');
    return sp;
  }

  async delete(id: string): Promise<void> {
    const res = await this.specialtyModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Specialty not found');
  }
}
