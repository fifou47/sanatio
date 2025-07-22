import {
  Controller, Get, Post, Body, Param, Put, Delete, Query,
  UseGuards, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceSearchDto } from './dto/invoice-search.dto';
import { JwtAuthGuard } from 'src/common/jwt-auth/jwt-auth.guard';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('invoices')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une facture' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les factures' })
  @ApiQuery({ name: 'status', required: false })
  list(@Query() q: InvoiceSearchDto) {
    return this.svc.search(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d’une facture' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour le statut d’une facture' })
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une facture' })
  delete(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Payer une facture' })
  @ApiResponse({ status: 200, description: 'Paiement réussi' })
  pay(@Param('id') id: string) {
    return this.svc.pay(id);
  }
}
