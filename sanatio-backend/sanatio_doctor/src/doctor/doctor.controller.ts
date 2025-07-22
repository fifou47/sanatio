import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private svc: DoctorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a doctor profile' })
  create(@Body() dto: CreateDoctorDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all doctors' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search doctors by filters' })
  @ApiQuery({ name: 'specialties', required: false, type: [String] })
  @ApiQuery({ name: 'maxRate', required: false, type: Number })
  search(@Query() dto: SearchDoctorDto) {
    return this.svc.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update doctor data' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a doctor' })
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
