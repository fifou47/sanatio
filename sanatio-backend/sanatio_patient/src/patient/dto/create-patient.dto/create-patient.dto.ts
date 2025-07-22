import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

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
}
