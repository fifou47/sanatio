import { IsString, IsNotEmpty, IsMongoId, IsNumber, IsOptional, IsArray, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ClinicAddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional({ description: 'GPS coordinates [lng, lat]' })
  @IsOptional()
  @IsArray()
  coordinates?: [number, number];
}

class EducationEntryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() institution?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() degree?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() year?: number;
}

export class CreateDoctorDto {
  @ApiProperty({ description: 'ID de l’utilisateur (User)', example: '64abcde1234f567890abcdef' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: ['64abcde1234f567890abcdef'], description: 'Liste des IDs de spécialités' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({ example: 100, description: 'Tarif de base' })
  @IsNumber()
  @IsNotEmpty()
  baseRate: number;

  @ApiPropertyOptional({ type: [String], example: ['fr','en'] })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;

  @ApiPropertyOptional({ type: [EducationEntryDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EducationEntryDto)
  education?: EducationEntryDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray()
  certifications?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() acceptsInsurance?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTelemedicine?: boolean;
  @ApiPropertyOptional({ enum: ['ONSITE','REMOTE','BOTH'] })
  @IsOptional() @IsEnum(['ONSITE','REMOTE','BOTH'])
  availabilityMode?: 'ONSITE'|'REMOTE'|'BOTH';

  @ApiPropertyOptional({ type: [ClinicAddressDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ClinicAddressDto)
  clinicAddresses?: ClinicAddressDto[];
}
