import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID de la consultation' })
  @IsUUID()
  consultationId: string;

  @ApiProperty({ description: 'ID du patient' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Montant de la facture' })
  @IsNumber()
  @Min(0)
  amount: number;
}
