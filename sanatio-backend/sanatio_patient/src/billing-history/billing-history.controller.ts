import {
  Controller,
  Post,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { BillingHistoryService } from './billing-history.service';
import { CreateBillDto } from './dto/create-bill.dto/create-bill.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Billing History')
@Controller('patients/:id/billing-history')
export class BillingHistoryController {
  constructor(private readonly service: BillingHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter une facture à un patient' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  @ApiResponse({ status: 201, description: 'Facture ajoutée' })
  addBill(@Param('id') patientId: string, @Body() dto: CreateBillDto) {
    return this.service.addBill(patientId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Voir l'historique des factures d’un patient" })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  getHistory(@Param('id') patientId: string) {
    return this.service.getHistory(patientId);
  }

  @Get(':billId')
  @ApiOperation({ summary: 'Voir une facture spécifique' })
  @ApiParam({ name: 'id', description: 'ID du patient' })
  @ApiParam({ name: 'billId', description: 'ID de la facture' })
  getBillById(
    @Param('id') patientId: string,
    @Param('billId') billId: string,
  ) {
    return this.service.getBillById(patientId, billId);
  }
}
