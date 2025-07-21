import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      ...dto,
      id: uuidv4(),
      password: hashedPassword,
    });
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findOne({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmailOrPhone(value: string): Promise<User | null> {
    return this.userModel.findOne({
      $or: [{ email: value }, { phone: value }],
    }).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findOneAndUpdate({ id }, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.userModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }
}
