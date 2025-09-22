import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
}

class EmergencyContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

export class CreatePatientDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+22812345678' })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'INS123456789' })
  @IsOptional()
  insuranceNumber?: string;

  @ApiProperty({ type: [String], example: ['Diabetes', 'Hypertension'] })
  @IsOptional()
  @IsArray()
  medicalHistory?: string[];

  @ApiProperty({ type: [String], example: ['Peanuts', 'Penicillin'] })
  @IsOptional()
  @IsArray()
  allergies?: string[];

  @ApiProperty({ type: [String], example: ['Metformin'] })
  @IsOptional()
  @IsArray()
  currentTreatments?: string[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://example.com/doc1.pdf' },
        type: { type: 'string', example: 'Ordonnance' },
        dateUpload: { type: 'string', format: 'date-time' },
      },
    },
  })
  @IsOptional()
  documents?: { url: string; type: string; dateUpload: Date }[];

  @ApiPropertyOptional({ enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] })
  @IsOptional()
  @IsEnum(['A+','A-','B+','B-','AB+','AB-','O+','O-'])
  bloodGroup?: string;

  @ApiPropertyOptional({ enum: ['M','F','O'] })
  @IsOptional()
  @IsEnum(['M','F','O'])
  gender?: 'M' | 'F' | 'O';

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ type: [String], example: ['fr','en'] })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() occupation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() placeOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() maritalStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() heightCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
  @ApiPropertyOptional() @IsOptional() smoker?: boolean;
  @ApiPropertyOptional() @IsOptional() alcoholUse?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
