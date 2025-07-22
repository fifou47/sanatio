import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialtyService } from './specialty.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Specialties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('specialties')
export class SpecialtyController {
  constructor(private svc: SpecialtyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a specialty' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all specialties' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
