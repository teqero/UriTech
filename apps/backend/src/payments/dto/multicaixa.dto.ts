import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MulticaixaWebhookDto {
  @IsString()
  reference!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  merchantRef?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class InitiateMulticaixaDto {
  @IsNumber()
  @Min(100)
  amount!: number;
}

export class SimulateMulticaixaDto {
  @IsString()
  reference!: string;
}
