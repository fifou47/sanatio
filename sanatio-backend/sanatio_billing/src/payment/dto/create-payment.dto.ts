import { IsUUID, IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID de la facture' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Montant payé' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'CARD' })
  @IsString()
  @IsNotEmpty()
  method: string;
}
