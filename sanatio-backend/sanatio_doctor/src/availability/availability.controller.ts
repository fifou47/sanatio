import { Controller, Get, Post, Param, Body, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('doctors/:doctorId/availability')
export class AvailabilityController {
  constructor(private svc: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'List availability slots for a doctor' })
  findAll(@Param('doctorId') doctorId: string) {
    return this.svc.findAll(doctorId);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available time slots for booking' })
  getAvailableTimeSlots(
    @Param('doctorId') doctorId: string,
    @Query('from') from: string,
    @Query('duration') duration: string,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const consultationDuration = duration ? parseInt(duration, 10) : 30;
    return this.svc.getAvailableTimeSlots(doctorId, fromDate, consultationDuration);
  }

  @Post()
  @ApiOperation({ summary: 'Create an availability slot' })
  create(@Param('doctorId') doctorId: string, @Body() dto: CreateAvailabilityDto) {
    return this.svc.create(doctorId, dto);
  }

  @Delete(':slotId')
  @ApiOperation({ summary: 'Remove an availability slot' })
  remove(@Param('doctorId') doctorId: string, @Param('slotId') slotId: string) {
    return this.svc.remove(doctorId, slotId);
  }
}
