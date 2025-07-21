import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Token de rafraîchissement JWT',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
