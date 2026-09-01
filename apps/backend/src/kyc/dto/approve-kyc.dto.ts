import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ApproveKycDto {
  @IsIn(['basic', 'verified', 'premium'])
  @IsOptional()
  @ApiProperty({
    description: 'Tier a atribuir ao utilizador',
    enum: ['basic', 'verified', 'premium'],
    example: 'verified',
    required: false,
  })
  tier?: 'basic' | 'verified' | 'premium';
}
