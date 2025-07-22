import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../schemas/invoice.schema';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
