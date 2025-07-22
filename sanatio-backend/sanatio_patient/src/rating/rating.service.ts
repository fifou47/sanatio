import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './rating/rating.schema';
import { CreateRatingDto } from './dto/create-rating.dto/create-rating.dto';

@Injectable()
export class RatingService {
  constructor(@InjectModel(Rating.name) private ratingModel: Model<Rating>) {}

  async submitRating(patientId: string, dto: CreateRatingDto): Promise<Rating> {
    const rating = new this.ratingModel({ patientId, ...dto });
    return rating.save();
  }

  async getRatingsForPatient(patientId: string): Promise<Rating[]> {
    return this.ratingModel.find({ patientId }).exec();
  }
}
