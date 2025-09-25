import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto/update-patient.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Patients')
@Controller('patients')
export class PatientController {
  constructor(private readonly service: PatientService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un patient' })
  @ApiResponse({ status: 201, description: 'Patient créé' })
  create(@Body() dto: CreatePatientDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les patients' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un patient par ID' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un patient' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un patient' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister ou rechercher des patients' })
  find(
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    if (email || phone) {
      return this.service.findByContact({ email, phone });
    }
    return this.service.findAll();
  }
}
