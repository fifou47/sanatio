// doctor/dto/add-availability.dto.ts

import { IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddAvailabilityDto {
  @ApiProperty({ example: '2025-07-25T10:00:00Z', description: 'Date de début du créneau' })
  @IsDateString()
  start: Date;

  @ApiProperty({ example: '2025-07-25T10:30:00Z', description: 'Date de fin du créneau' })
  @IsDateString()
  end: Date;

  @ApiProperty({ example: false, description: 'Statut de réservation du créneau' })
  @IsBoolean()
  isBooked: boolean;
}
