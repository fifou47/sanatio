import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { PermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(@InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>) {}

  async create(dto: PermissionDto): Promise<Permission> {
    return new this.permissionModel(dto).save();
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }
}
