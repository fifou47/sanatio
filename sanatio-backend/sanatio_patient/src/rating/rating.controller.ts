import {
  Controller,
  Post,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto/create-rating.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Rating')
@Controller('patients/:id/ratings')
export class RatingController {
  constructor(private readonly service: RatingService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter une évaluation pour un patient' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  @ApiResponse({ status: 201, description: 'Évaluation ajoutée' })
  addRating(@Param('id') patientId: string, @Body() dto: CreateRatingDto) {
    return this.service.submitRating(patientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les évaluations d’un patient' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  getRatings(@Param('id') patientId: string) {
    return this.service.getRatingsForPatient(patientId);
  }
}
