import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@email.com',
    description: 'Email ou numéro de téléphone de l’utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mot de passe de l’utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
