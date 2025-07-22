import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsultationStatus } from '../schemas/consultation.schema';

export class ChangeStatusDto {
  @ApiProperty({ enum: ConsultationStatus })
  @IsEnum(ConsultationStatus) @IsNotEmpty()
  status: ConsultationStatus;
}
