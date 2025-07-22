import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookAvailabilityDto {
  @ApiProperty({ example: 'patientUserId-uuid-string' })
  @IsString()
  @IsNotEmpty()
  patientId: string;
}
