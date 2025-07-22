import { IsMongoId, IsDateString, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
}
