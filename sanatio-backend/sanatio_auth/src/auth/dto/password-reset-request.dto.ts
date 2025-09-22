import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'john.doe@email.com', description: 'Email ou téléphone utilisé lors de la création du compte' })
  @IsString()
  @IsNotEmpty()
  emailOrPhone!: string;
}
