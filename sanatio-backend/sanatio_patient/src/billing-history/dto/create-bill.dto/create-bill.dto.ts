import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBillDto {
  @ApiProperty({ example: 'INV001' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ example: 125.50 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'PAID' })
  @IsString()
  status: string;
}
