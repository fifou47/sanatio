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
  @IsOptional() @IsArray()
  coordinates?: [number, number];
}

class EducationEntryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() institution?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() degree?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() year?: number;
}

export class CreateDoctorDto {
  // --- identité & appellation ---
  @ApiProperty({ example: 'Kossi' }) @IsString() @IsNotEmpty() firstName: string;
  @ApiProperty({ example: 'Mensah' }) @IsString() @IsNotEmpty() lastName: string;

  @ApiPropertyOptional({
    enum: ['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'],
    description: 'Appellation affichée (préfixe). Défaut: DR'
  })
  @IsOptional()
  @IsEnum(['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE'])
  title?: string;

  @ApiPropertyOptional({ description: 'URL de la photo de profil' })
  @IsOptional() @IsString()
  profilePhotoUrl?: string;

  // --- liaison User ---
  @ApiProperty({ description: 'ID de l’utilisateur (User)', example: '64abcde1234f567890abcdef' })
  @IsMongoId() @IsNotEmpty()
  userId: string;

  // --- spécialités & tarifs ---
  @ApiProperty({ example: 100, description: 'Tarif de base' })
  @IsNumber() @IsNotEmpty()
  baseRate: number;

  @ApiProperty({ example: ['64abcde1234f567890abcdef'], description: 'Liste des IDs de spécialités', required: false })
  @IsOptional() @IsArray() @IsMongoId({ each: true })
  specialties?: string[];

  // --- infos diverses ---
  @ApiPropertyOptional({ type: [String], example: ['fr','en'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [EducationEntryDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => EducationEntryDto)
  education?: EducationEntryDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  acceptsInsurance?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isTelemedicine?: boolean;

  @ApiPropertyOptional({ enum: ['ONSITE','REMOTE','BOTH'] })
  @IsOptional() @IsEnum(['ONSITE','REMOTE','BOTH'])
  availabilityMode?: 'ONSITE'|'REMOTE'|'BOTH';

  @ApiPropertyOptional({ type: [ClinicAddressDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ClinicAddressDto)
  clinicAddresses?: ClinicAddressDto[];
}
