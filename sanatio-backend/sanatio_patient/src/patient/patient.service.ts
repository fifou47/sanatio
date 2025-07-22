import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const patient = await this.patientModel.findOne({ id });
    if (!patient) throw new NotFoundException('Patient non trouvé');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const updated = await this.patientModel.findOneAndUpdate({ id }, dto, { new: true });
    if (!updated) throw new NotFoundException('Patient non trouvé');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.patientModel.deleteOne({ id });
    if (res.deletedCount === 0) throw new NotFoundException('Patient non trouvé');
  }
}
