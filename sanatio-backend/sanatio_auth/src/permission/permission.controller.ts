import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { PermissionDto } from './dto/permission.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une permission' })
  @ApiResponse({ status: 201, description: 'Permission créée avec succès' })
  create(@Body() dto: PermissionDto) {
    return this.permissionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les permissions' })
  @ApiResponse({ status: 200, description: 'Liste des permissions' })
  findAll() {
    return this.permissionService.findAll();
  }
}
