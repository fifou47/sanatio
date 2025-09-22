import { IsMongoId, IsDateString, IsNumber, Min, IsEnum, IsOptional, IsString, IsArray, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationType } from '../schemas/consultation.schema';

export class CreateConsultationDto {
  @ApiProperty({ example: '64abc...123', description: 'ID du patient' })
  @IsMongoId() patientId: string;

  @ApiProperty({ example: '64def...456', description: 'ID du médecin' })
  @IsMongoId() doctorId: string;

  @ApiProperty({ example: '2025-08-01T15:00:00Z' })
  @IsDateString() startTime: string;

  @ApiProperty({ example: 30, description: 'Durée en minutes' })
  @IsNumber() @Min(5) duration: number;

  @ApiProperty({ enum: ConsultationType })
  @IsEnum(ConsultationType) type: ConsultationType;

  @ApiPropertyOptional({ description: 'Motif de la consultation' })
  @IsOptional() @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Consultation de groupe' })
  @IsOptional()
  isGroup?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'IDs utilisateurs Auth supplémentaires' })
  @IsOptional() @IsArray()
  additionalUserIds?: string[];

  @ApiPropertyOptional({ description: 'ID utilisateur Auth du patient' })
  @IsOptional() @IsString()
  patientUserId?: string;

  @ApiPropertyOptional({ description: 'ID utilisateur Auth du médecin' })
  @IsOptional() @IsString()
  doctorUserId?: string;
}
