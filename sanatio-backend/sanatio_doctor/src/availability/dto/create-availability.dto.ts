import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: '2025-08-01T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({ example: '2025-08-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  end: string;
}
