import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectKycDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Razão da rejeição do KYC',
    example: 'Documento ilegível. Por favor submeter nova foto.',
  })
  reason!: string;
}
