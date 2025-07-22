import { IsString, IsNotEmpty, IsMongoId, IsNumber, ArrayNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({ description: 'ID de l’utilisateur (User)', example: '64abcde1234f567890abcdef' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: ['64abcde1234f567890abcdef'], description: 'Liste des IDs de spécialités' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({ example: 100, description: 'Tarif de base' })
  @IsNumber()
  @IsNotEmpty()
  baseRate: number;
}
