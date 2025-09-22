import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultationStatus } from '../schemas/consultation.schema';

export class ChangeStatusDto {
  @ApiProperty({ enum: ConsultationStatus })
  @IsEnum(ConsultationStatus) @IsNotEmpty()
  status: ConsultationStatus;

  @ApiPropertyOptional({ description: 'Raison de l’annulation (si CANCELED)' })
  @IsOptional() @IsString()
  cancellationReason?: string;
}
