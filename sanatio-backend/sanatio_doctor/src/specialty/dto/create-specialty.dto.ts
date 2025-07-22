import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Heart specialist', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
