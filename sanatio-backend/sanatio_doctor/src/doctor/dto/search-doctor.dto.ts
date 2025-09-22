import { IsOptional, IsNumber, IsArray, IsBoolean, IsEnum } from 'class-validator';
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

  @ApiPropertyOptional({ type: [String], example: ['fr'] })
  @IsOptional() @IsArray()
  languages?: string[];

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional() @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  isTelemedicine?: boolean;

  @ApiPropertyOptional({ enum: ['ONSITE','REMOTE','BOTH'] })
  @IsOptional() @IsEnum(['ONSITE','REMOTE','BOTH'])
  availabilityMode?: 'ONSITE'|'REMOTE'|'BOTH';

  @ApiPropertyOptional({ description: 'near longitude' })
  @IsOptional() @IsNumber()
  lng?: number;
  @ApiPropertyOptional({ description: 'near latitude' })
  @IsOptional() @IsNumber()
  lat?: number;
  @ApiPropertyOptional({ description: 'max distance in km', example: 20 })
  @IsOptional() @IsNumber()
  maxDistanceKm?: number;
}
