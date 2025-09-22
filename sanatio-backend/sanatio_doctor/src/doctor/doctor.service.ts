import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    private http: HttpService,
  ) {}

  // Vérifier que userId existe via Service Auth
  private async validateUser(userId: string) {
    const url = `http://localhost:3000/users/${userId}`; // endpoint du service User
    try {
      await firstValueFrom(this.http.get(url));
    } catch {
      throw new BadRequestException('User not found in Auth service');
    }
  }

  async create(dto: CreateDoctorDto) {
    await this.validateUser(dto.userId);
    const doc = new this.doctorModel({
      userId: new Types.ObjectId(dto.userId),
      specialties: dto.specialties?.map(id => new Types.ObjectId(id)) || [],
      baseRate: dto.baseRate,
      languages: dto.languages || [],
      bio: dto.bio,
      education: dto.education,
      certifications: dto.certifications,
      registrationNumber: dto.registrationNumber,
      acceptsInsurance: dto.acceptsInsurance,
      isTelemedicine: dto.isTelemedicine ?? true,
      availabilityMode: dto.availabilityMode || 'BOTH',
      clinicAddresses: (dto.clinicAddresses || []).map(a => ({
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
        country: a.country,
        location: a.coordinates ? { type: 'Point', coordinates: a.coordinates } : undefined,
      })),
    });
    return doc.save();
  }

  async findAll() {
    return this.doctorModel.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.doctorModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    if (dto.userId) await this.validateUser(dto.userId);
    const doc = await this.doctorModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        specialties: dto.specialties?.map(id => new Types.ObjectId(id)),
        clinicAddresses: dto.clinicAddresses?.map(a => ({
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          region: a.region,
          postalCode: a.postalCode,
          country: a.country,
          location: a.coordinates ? { type: 'Point', coordinates: a.coordinates } : undefined,
        })),
      },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  async delete(id: string) {
    const res = await this.doctorModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Doctor not found');
  }

  async search(dto: SearchDoctorDto) {
    const filter: any = {};
    if (dto.specialties) {
      filter.specialties = { $in: dto.specialties.map(id => new Types.ObjectId(id)) };
    }
    if (dto.maxRate != null) {
      filter.baseRate = { $lte: dto.maxRate };
    }
    if (dto.languages && dto.languages.length) {
      filter.languages = { $in: dto.languages };
    }
    if (dto.minRating != null) {
      filter.ratingAverage = { $gte: dto.minRating };
    }
    if (dto.isTelemedicine != null) {
      filter.isTelemedicine = dto.isTelemedicine;
    }
    if (dto.availabilityMode) {
      filter.availabilityMode = dto.availabilityMode;
    }

    // Geo filter if provided
    if (dto.lat != null && dto.lng != null && dto.maxDistanceKm != null) {
      const max = Math.max(0, Number(dto.maxDistanceKm)) * 1000; // meters
      filter['clinicAddresses.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [dto.lng, dto.lat] },
          $maxDistance: max,
        },
      };
    }
    return this.doctorModel.find(filter).exec();
  }
}
