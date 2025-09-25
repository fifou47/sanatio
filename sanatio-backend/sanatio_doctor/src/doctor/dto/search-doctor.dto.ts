import { IsOptional, IsNumber, IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDoctorDto {
  @ApiPropertyOptional({ example: 'Mensah', description: 'Recherche nom/prénom (regex insensible)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: ['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'],
    description: 'Filtrer par appellation'
  })
  @IsOptional()
  @IsEnum(['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'])
  title?: string;

  @ApiPropertyOptional({ example: ['64abcde1234f567890abcdef'] })
  @IsOptional() @IsArray()
  specialties?: string[];

  @ApiPropertyOptional({ example: 10, description: 'Tarif minimum' })
  @IsOptional() @IsNumber()
  minRate?: number;

  @ApiPropertyOptional({ example: 50, description: 'Tarif maximum' })
  @IsOptional() @IsNumber()
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

  // --- géo ---
  @ApiPropertyOptional({ description: 'near longitude' })
  @IsOptional() @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'near latitude' })
  @IsOptional() @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'max distance in km', example: 20 })
  @IsOptional() @IsNumber()
  maxDistanceKm?: number;

  @ApiPropertyOptional({ description: 'Inclure la distance (mètres) dans la réponse si filtre géo', example: false })
  @IsOptional() @IsBoolean()
  includeDistance?: boolean;
}
