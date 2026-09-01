import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString, Min } from 'class-validator';

export class TopUpWalletDto {
  @ApiProperty({ example: 5000, description: 'Valor a carregar em Kwanzas (AOA)', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class TransferWalletDto {
  @ApiProperty({ example: 'maria@uritech.com', description: 'Email do destinatário' })
  @IsEmail()
  toEmail!: string;

  @ApiProperty({ example: 2000, description: 'Valor a transferir em Kwanzas (AOA)', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class WithdrawWalletDto {
  @ApiProperty({ example: 5000, description: 'Valor a sacar em Kwanzas (AOA)', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class PayWalletDto {
  @ApiProperty({ example: 3000, description: 'Valor a pagar em Kwanzas (AOA)', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Pagamento de serviço de taxi', description: 'Descrição do pagamento' })
  @IsString()
  description!: string;
}

export class WalletSummaryDto {
  @ApiProperty({ example: 15000 })
  balance!: number;

  @ApiProperty({ example: 'AOA' })
  currency!: string;

  @ApiProperty({ example: '**** 4291' })
  mask!: string;

  @ApiProperty({ example: [] })
  transactions!: any[];
}
