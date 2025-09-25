import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Patient } from './patient/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(@InjectModel(Patient.name) private patientModel: Model<Patient>) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const created = new this.patientModel(dto);
    return created.save();
  }

  async findAll(): Promise<Patient[]> {
    return this.patientModel.find().exec();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientModel.findById(id).exec();
    if (!patient) throw new NotFoundException('Patient non trouvé');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const updated = await this.patientModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Patient non trouvé');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.patientModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Patient non trouvé');
  }

  async findByContact(opts: { email?: string; phone?: string }): Promise<Patient[]> {
    const filter: FilterQuery<Patient> = {};
    if (opts.email) filter.email = String(opts.email).trim().toLowerCase();
    if (opts.phone) filter.phone = String(opts.phone).trim();
    return this.patientModel.find(filter).limit(20).exec();
  }
}
