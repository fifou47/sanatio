import { IsOptional, IsNumber, IsMongoId, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDoctorDto {
  @ApiPropertyOptional({ example: ['Cardiology'] })
  @IsOptional()
  @IsArray()
  specialties?: string[];

  @ApiPropertyOptional({ example: 50, description: 'Tarif maximum' })
  @IsOptional()
  @IsNumber()
  maxRate?: number;
}
