// doctor/dto/add-specialty.dto.ts

import { IsMongoId, ArrayNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSpecialtyDto {
  @ApiProperty({
    type: [String],
    description: 'Liste des IDs de spécialités à ajouter au médecin',
    example: ['64e8f1d344ccf2f4a9b1fdf1', '64e8f1d344ccf2f4a9b1fdf2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  specialtyIds: string[];
}
