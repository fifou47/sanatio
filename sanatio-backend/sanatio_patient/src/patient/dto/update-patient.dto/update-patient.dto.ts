import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from '../create-patient.dto/create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
