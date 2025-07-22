import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/common/jwt-auth/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un paiement' })
  create(@Body() dto: CreatePaymentDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les paiements' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d’un paiement' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
