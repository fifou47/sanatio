import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConsultationService } from './consultation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@ApiTags('Consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationController {
  constructor(private svc: ConsultationService) {}

  @Post()
  @ApiOperation({ summary: 'Planifier une consultation' })
  create(@Body() dto: CreateConsultationDto) { return this.svc.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les consultations' })
  findAll() { return this.svc.findAll(); }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Lister les consultations pour un médecin (inter-service)' })
  findAllForDoctor(
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.svc.findAllForDoctor(doctorId, fromDate, toDate);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une consultation' })
  update(@Param('id') id: string, @Body() dto: UpdateConsultationDto) {
    return this.svc.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Changer le status d’une consultation' })
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.svc.changeStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler une consultation' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
