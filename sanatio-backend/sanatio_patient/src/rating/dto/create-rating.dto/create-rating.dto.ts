import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ example: 4, description: 'Note entre 1 et 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Bon suivi médical', description: 'Commentaire optionnel' })
  @IsNotEmpty()
  comment: string;
}
