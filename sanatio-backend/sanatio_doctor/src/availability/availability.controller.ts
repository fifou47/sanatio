import { Controller, Get, Post, Param, Body, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { BookAvailabilityDto } from './dto/update-availability.dto';
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

  @Post()
  @ApiOperation({ summary: 'Create an availability slot' })
  create(@Param('doctorId') doctorId: string, @Body() dto: CreateAvailabilityDto) {
    return this.svc.create(doctorId, dto);
  }

  @Post(':slotId/book')
  @ApiOperation({ summary: 'Book an availability slot' })
  book(
    @Param('doctorId') doctorId: string,
    @Param('slotId') slotId: string,
    @Body() dto: BookAvailabilityDto,
  ) {
    return this.svc.book(doctorId, slotId, dto);
  }

  @Delete(':slotId')
  @ApiOperation({ summary: 'Remove an availability slot' })
  remove(@Param('doctorId') doctorId: string, @Param('slotId') slotId: string) {
    return this.svc.remove(doctorId, slotId);
  }
}
