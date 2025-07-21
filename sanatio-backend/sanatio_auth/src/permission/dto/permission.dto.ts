import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({ example: 'create_user', description: 'Nom unique de la permission' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
