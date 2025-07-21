import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { RoleDto } from './dto/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un rôle' })
  @ApiResponse({ status: 201, description: 'Rôle créé avec succès' })
  create(@Body() dto: RoleDto) {
    return this.roleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les rôles' })
  @ApiResponse({ status: 200, description: 'Liste des rôles' })
  findAll() {
    return this.roleService.findAll();
  }
}
