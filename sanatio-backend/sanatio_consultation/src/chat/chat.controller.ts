import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Lister les messages par consultation (paginé)' })
  @ApiQuery({ name: 'consultationId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @Query('consultationId') consultationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chat.list(consultationId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Obtenir un message par ID' })
  getById(@Param('id') id: string) {
    return this.chat.getById(id);
  }
}

