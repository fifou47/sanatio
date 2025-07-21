import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'Nouveau nom' })
  name?: string;

  @ApiPropertyOptional({ example: 'new@email.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+22898765432' })
  phone?: string;

  @ApiPropertyOptional({ example: 'newpassword' })
  password?: string;
}
