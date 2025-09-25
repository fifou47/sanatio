import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards,
  DefaultValuePipe, ParseIntPipe, ParseBoolPipe
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdatePhotoDto {
  @ApiProperty({ description: 'URL de la photo de profil' })
  @IsString()
  profilePhotoUrl!: string;
}

class RateDoctorDto {
  @ApiProperty({ description: 'Note entre 0 et 5', minimum: 0, maximum: 5, example: 4.5 })
  @IsNumber()
  score!: number;
}

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  // ===== Create =====
  @Post()
  @ApiOperation({ summary: 'Create a doctor profile' })
  create(@Body() dto: CreateDoctorDto) {
    return this.svc.create(dto);
  }

  // ===== List (pagination/tri/projection/populate) =====
  @Get()
  @ApiOperation({ summary: 'List doctors (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page >= 1', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'ratingAverage' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc','desc'], example: 'desc' })
  @ApiQuery({ name: 'fields', required: false, type: String, description: 'Projection: "firstName,lastName,title"' })
  @ApiQuery({ name: 'populate', required: false, type: Boolean, example: true })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortDir', new DefaultValuePipe('desc')) sortDir: 'asc' | 'desc',
    @Query('fields') fields?: string,
    @Query('populate', new DefaultValuePipe(true), ParseBoolPipe) populate?: boolean,
  ) {
    return this.svc.list({ page, limit, sortBy, sortDir, fields, populate });
  }

  // ===== Search (filtres + pagination/tri/projection/populate + géo) =====
  @Get('search')
  @ApiOperation({ summary: 'Search doctors by filters' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Nom/Prénom (regex insensible)' })
  @ApiQuery({ name: 'title', required: false, enum: ['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'] })
  @ApiQuery({ name: 'specialties', required: false, type: [String] })
  @ApiQuery({ name: 'minRate', required: false, type: Number })
  @ApiQuery({ name: 'maxRate', required: false, type: Number })
  @ApiQuery({ name: 'languages', required: false, type: [String] })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'isTelemedicine', required: false, type: Boolean })
  @ApiQuery({ name: 'availabilityMode', required: false, enum: ['ONSITE','REMOTE','BOTH'] })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'maxDistanceKm', required: false, type: Number })
  @ApiQuery({ name: 'includeDistance', required: false, type: Boolean, description: 'Retourne distanceMeters (via $geoNear)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'ratingAverage' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc','desc'], example: 'desc' })
  @ApiQuery({ name: 'fields', required: false, type: String })
  @ApiQuery({ name: 'populate', required: false, type: Boolean, example: true })
  search(
    @Query() dto: SearchDoctorDto, // transform=true dans main.ts => les types sont castés
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('ratingAverage')) sortBy: string,
    @Query('sortDir', new DefaultValuePipe('desc')) sortDir: 'asc' | 'desc',
    @Query('fields') fields?: string,
    @Query('populate', new DefaultValuePipe(true), ParseBoolPipe) populate?: boolean,
  ) {
    return this.svc.search(dto, {
      page,
      limit,
      sortBy,
      sortDir,
      fields,
      populate,
      includeDistance: dto.includeDistance === true, // lu depuis le DTO
    });
  }

  // ===== Get by ID =====
  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'populate', required: false, type: Boolean, example: true })
  findOne(
    @Param('id') id: string,
    @Query('populate', new DefaultValuePipe(true), ParseBoolPipe) populate?: boolean,
  ) {
    return this.svc.findOne(id, { populate });
  }

  // ===== Update =====
  @Put(':id')
  @ApiOperation({ summary: 'Update doctor data' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.svc.update(id, dto);
  }

  // ===== Update profile photo only =====
  @Patch(':id/photo')
  @ApiOperation({ summary: 'Update profile photo URL' })
  @ApiBody({ type: UpdatePhotoDto })
  updatePhoto(@Param('id') id: string, @Body() body: UpdatePhotoDto) {
    return this.svc.updatePhoto(id, body.profilePhotoUrl);
  }

  // ===== Rate a doctor (0..5) =====
  @Post(':id/rate')
  @ApiOperation({ summary: 'Submit a rating (0..5) and update average/count atomically' })
  @ApiBody({ type: RateDoctorDto })
  rate(@Param('id') id: string, @Body() body: RateDoctorDto) {
    return this.svc.rateDoctor(id, body.score);
  }

  // ===== Delete =====
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor' })
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
