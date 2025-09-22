import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PasswordResetConfirmDto {
  @ApiProperty({ example: '123456', description: 'Token ou code de réinitialisation reçu par email/SMS' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newStrongPassword1!', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
