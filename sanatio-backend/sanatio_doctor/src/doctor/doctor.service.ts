import {
  Injectable, NotFoundException, BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
  import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Model, Types, isValidObjectId,
  ProjectionType, SortOrder
} from 'mongoose';
import { Doctor, DoctorDocument } from './schemas/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';
import { AxiosError } from 'axios';

type ListOpts = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  fields?: string;              // "firstName,lastName,title"
  populate?: boolean;
  includeDistance?: boolean;    // only for search with geo
};

@Injectable()
export class DoctorService {
  private readonly authBase = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3000';
  private readonly logger = new Logger(DoctorService.name);
  constructor(
    @InjectModel(Doctor.name) private readonly doctorModel: Model<DoctorDocument>,
    private readonly http: HttpService,
  ) {}

  // ---------- Utils ----------
  private ensureObjectId(id: string): Types.ObjectId {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ObjectId');
    return new Types.ObjectId(id);
  }

  /** Projection pour find() ET pour $project en pipeline */
  private buildProjection(fields?: string): {
    find?: ProjectionType<DoctorDocument>;
    agg?: Record<string, 0 | 1>;
  } {
    if (!fields) return {};
    const keys = fields.split(',').map(s => s.trim()).filter(Boolean);
    if (!keys.length) return {};

    const findProj: ProjectionType<DoctorDocument> = {};
    const aggProj: Record<string, 0 | 1> = {};
    for (const k of keys) {
      (findProj as any)[k] = 1;
      aggProj[k] = 1;
    }
    return { find: findProj, agg: aggProj };
  }

  /** Sort pour find() (asc/desc) ET pour aggregate (1/-1) */
  private buildSort(sortBy?: string, sortDir: 'asc'|'desc' = 'desc'): {
    find: Record<string, SortOrder>;
    agg: Record<string, 1 | -1>;
    key: string;
    dir: 'asc' | 'desc';
  } {
    const allowed = new Set([
      'createdAt','updatedAt','ratingAverage','ratingCount','baseRate','lastName','firstName'
    ]);
    const key = allowed.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const dirStr: 'asc'|'desc' = sortDir === 'asc' ? 'asc' : 'desc';
    const dirNum: 1 | -1 = dirStr === 'asc' ? 1 : -1;
    return {
      find: { [key]: dirStr },
      agg: { [key]: dirNum },
      key,
      dir: dirStr,
    };
  }

  private buildFilter(dto: SearchDoctorDto) {
    const filter: any = {};

    if (dto.specialties?.length) {
      filter.specialties = { $in: dto.specialties.map(id => this.ensureObjectId(id)) };
    }

    if (dto.minRate != null || dto.maxRate != null) {
      filter.baseRate = {};
      if (dto.minRate != null) filter.baseRate.$gte = Number(dto.minRate);
      if (dto.maxRate != null) filter.baseRate.$lte = Number(dto.maxRate);
      if (Object.keys(filter.baseRate).length === 0) delete filter.baseRate;
    }

    if (dto.languages?.length) filter.languages = { $in: dto.languages };
    if (dto.minRating != null) filter.ratingAverage = { $gte: Number(dto.minRating) };
    if (dto.isTelemedicine != null) filter.isTelemedicine = !!dto.isTelemedicine;
    if (dto.availabilityMode) filter.availabilityMode = dto.availabilityMode;
    if (dto.title) filter.title = dto.title;

    if (dto.q) {
      const re = new RegExp(dto.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ firstName: re }, { lastName: re }];
    }

    return filter;
  }

private async validateUser(userId: string) {
  const url = `${this.authBase}/users/${userId}`;
  this.logger.debug(`validateUser → GET ${url}`);

  try {
    await firstValueFrom(this.http.get(url));
    this.logger.log(`validateUser OK userId=${userId}`);
  } catch (e) {
    const err = e as AxiosError<any>;
    const status = err.response?.status;
    const data = err.response?.data;

    // logs utiles pour diagnostiquer
    this.logger.warn(
      `validateUser FAIL userId=${userId} status=${status} url=${url} msg=${err.message}`
    );
    if (data) this.logger.verbose(`validateUser payload: ${JSON.stringify(data)}`);

    // message côté client
    throw new BadRequestException('User not found in Auth service');
  }
}


  private populateSpec(query: any) {
    return query.populate({ path: 'specialties', select: 'name description' });
  }

  // ---------- Create ----------
  async create(dto: CreateDoctorDto) {
    await this.validateUser(dto.userId);
    try {
      const doc = new this.doctorModel({
        userId: this.ensureObjectId(dto.userId),

        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title ?? 'DR',
        profilePhotoUrl: dto.profilePhotoUrl,

        specialties: dto.specialties?.map(id => this.ensureObjectId(id)) ?? [],
        baseRate: dto.baseRate,
        languages: dto.languages ?? [],
        bio: dto.bio,
        education: dto.education,
        certifications: dto.certifications,
        registrationNumber: dto.registrationNumber,

        ratingAverage: 0,
        ratingCount: 0,

        acceptsInsurance: dto.acceptsInsurance ?? false,
        isTelemedicine: dto.isTelemedicine ?? true,
        availabilityMode: dto.availabilityMode ?? 'BOTH',
        clinicAddresses: (dto.clinicAddresses ?? []).map((a: any) => ({
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          region: a.region,
          postalCode: a.postalCode,
          country: a.country,
          location: a.coordinates ? { type: 'Point', coordinates: a.coordinates } : undefined,
        })),
      });
      return await doc.save();
    } catch (e: any) {
      if (e?.code === 11000 && e?.keyPattern?.registrationNumber) {
        throw new BadRequestException('registrationNumber already exists');
      }
      throw e;
    }
  }

  // ---------- List ----------
  async list(opts: ListOpts = {}) {
    const { page = 1, limit = 20, sortBy, sortDir, fields, populate = true } = opts;
    const proj = this.buildProjection(fields);
    const sort = this.buildSort(sortBy, sortDir);
    const skip = Math.max(0, (Number(page) - 1) * Number(limit));

    const q = this.doctorModel
      .find({}, proj.find)
      .sort(sort.find)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const [data, total] = await Promise.all([
      populate ? this.populateSpec(q) : q,
      this.doctorModel.countDocuments({}),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
      sort: sort.find,
    };
  }

  // ---------- Find one ----------
  async findOne(id: string, opts: Pick<ListOpts, 'populate'> = { populate: true }) {
    const _id = this.ensureObjectId(id);
    const q = this.doctorModel.findById(_id).lean();
    const doc = await (opts.populate ? this.populateSpec(q) : q);
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  // ---------- Update ----------
  async update(id: string, dto: UpdateDoctorDto) {
    if (dto.userId) await this.validateUser(dto.userId);
    const _id = this.ensureObjectId(id);

    // whitelist des champs modifiables
    const update: any = {};
    if (dto.userId !== undefined) update.userId = this.ensureObjectId(dto.userId);
    if (dto.firstName !== undefined) update.firstName = dto.firstName;
    if (dto.lastName !== undefined) update.lastName = dto.lastName;
    if (dto.title !== undefined) update.title = dto.title;
    if (dto.profilePhotoUrl !== undefined) update.profilePhotoUrl = dto.profilePhotoUrl;

    if (dto.specialties) update.specialties = dto.specialties.map(x => this.ensureObjectId(x));
    if (dto.baseRate !== undefined) update.baseRate = dto.baseRate;
    if (dto.languages !== undefined) update.languages = dto.languages;
    if (dto.bio !== undefined) update.bio = dto.bio;
    if (dto.education !== undefined) update.education = dto.education;
    if (dto.certifications !== undefined) update.certifications = dto.certifications;
    if (dto.registrationNumber !== undefined) update.registrationNumber = dto.registrationNumber;
    if (dto.acceptsInsurance !== undefined) update.acceptsInsurance = dto.acceptsInsurance;
    if (dto.isTelemedicine !== undefined) update.isTelemedicine = dto.isTelemedicine;
    if (dto.availabilityMode !== undefined) update.availabilityMode = dto.availabilityMode;

    if (dto.clinicAddresses) {
      update.clinicAddresses = dto.clinicAddresses.map((a: any) => ({
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
        country: a.country,
        location: a.coordinates ? { type: 'Point', coordinates: a.coordinates } : undefined,
      }));
    }

    try {
      const doc = await this.doctorModel.findByIdAndUpdate(_id, update, { new: true }).lean();
      if (!doc) throw new NotFoundException('Doctor not found');
      return doc;
    } catch (e: any) {
      if (e?.code === 11000 && e?.keyPattern?.registrationNumber) {
        throw new BadRequestException('registrationNumber already exists');
      }
      throw e;
    }
  }

  // ---------- Update photo only ----------
  async updatePhoto(id: string, profilePhotoUrl: string) {
    const _id = this.ensureObjectId(id);
    const doc = await this.doctorModel.findByIdAndUpdate(_id, { profilePhotoUrl }, { new: true }).lean();
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }

  // ---------- Delete ----------
  async delete(id: string) {
    const _id = this.ensureObjectId(id);
    const res = await this.doctorModel.findByIdAndDelete(_id).lean();
    if (!res) throw new NotFoundException('Doctor not found');
    return { deleted: true };
  }

  // ---------- Search (with optional $geoNear + distance) ----------
  async search(dto: SearchDoctorDto, opts: ListOpts = {}) {
    const {
      page = 1, limit = 20, sortBy, sortDir, fields, populate = true, includeDistance = false,
    } = opts;

    const filter = this.buildFilter(dto);
    const proj = this.buildProjection(fields);
    const sort = this.buildSort(sortBy, sortDir);
    const skip = Math.max(0, (Number(page) - 1) * Number(limit));

    const hasGeo = dto.lat != null && dto.lng != null && dto.maxDistanceKm != null;

    if (includeDistance && hasGeo) {
      const near = {
        type: 'Point' as const,
        coordinates: [Number(dto.lng), Number(dto.lat)],
      };
      const maxDistance = Math.max(0, Number(dto.maxDistanceKm)) * 1000;

      const projectStage = proj.agg
        ? [{ $project: { ...proj.agg, distanceMeters: 1 } }]
        : [];

      const pipeline: any[] = [
        {
          $geoNear: {
            near,
            distanceField: 'distanceMeters',
            spherical: true,
            maxDistance,
            query: filter,
          }
        },
        { $sort: sort.agg },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: Number(limit) },
              ...(populate ? [
                {
                  $lookup: {
                    from: 'specialties',
                    localField: 'specialties',
                    foreignField: '_id',
                    as: 'specialties',
                    pipeline: [{ $project: { name: 1, description: 1 } }]
                  }
                }
              ] : []),
              ...projectStage
            ],
            total: [{ $count: 'count' }]
          }
        }
      ];

      const [res] = await this.doctorModel.aggregate(pipeline).exec();
      const data = res?.data ?? [];
      const total = res?.total?.[0]?.count ?? 0;

      return {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)) || 1,
        },
        sort: sort.find, // on renvoie la forme "find" (asc/desc) pour l’API
      };
    }

    // Simple find ($near sans distance en sortie)
    if (hasGeo) {
      (filter as any)['clinicAddresses.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(dto.lng), Number(dto.lat)] },
          $maxDistance: Math.max(0, Number(dto.maxDistanceKm)) * 1000,
        }
      };
    }

    const q = this.doctorModel
      .find(filter, proj.find)
      .sort(sort.find)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const [data, total] = await Promise.all([
      populate ? this.populateSpec(q) : q,
      this.doctorModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
      sort: sort.find,
    };
  }

  // ---------- Rate a doctor (0..5) ----------
  async rateDoctor(id: string, score: number) {
    const _id = this.ensureObjectId(id);
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0 || s > 5) {
      throw new BadRequestException('score must be a number between 0 and 5');
    }

    // update pipeline atomique (MongoDB >= 4.2)
    const res = await this.doctorModel.updateOne({ _id }, [
      {
        $set: {
          ratingAverage: {
            $divide: [
              { $add: [{ $multiply: ['$ratingAverage', '$ratingCount'] }, s] },
              { $add: ['$ratingCount', 1] }
            ]
          },
          ratingCount: { $add: ['$ratingCount', 1] }
        }
      }
    ]).exec();

    const matched = (res as any)?.matchedCount ?? (res as any)?.n ?? 0;
    if (!matched) throw new NotFoundException('Doctor not found');

    return this.doctorModel.findById(_id).lean();
  }
}
