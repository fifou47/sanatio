import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({ example: 'admin', description: 'Nom du rôle' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
