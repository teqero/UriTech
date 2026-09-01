import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class SubmitKycDto {
  @IsIn(['bi', 'passport', 'driving_license'])
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipo de documento de identificação',
    enum: ['bi', 'passport', 'driving_license'],
    example: 'bi',
  })
  documentType!: 'bi' | 'passport' | 'driving_license';

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Número do documento',
    example: '006546782LA045',
  })
  documentNumber!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'URL da foto frontal do documento',
    example: 'https://storage.uritech.com/kyc/user1/front.jpg',
  })
  documentFrontUrl!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'URL da foto traseira do documento',
    example: 'https://storage.uritech.com/kyc/user1/back.jpg',
  })
  documentBackUrl!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'URL da selfie para verificação facial',
    example: 'https://storage.uritech.com/kyc/user1/selfie.jpg',
  })
  selfieUrl!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Nacionalidade',
    example: 'Angola',
  })
  nationality?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Data de nascimento (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Morada (linha de endereço)',
    example: 'Rua dos Coqueiros, 123',
  })
  addressLine?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'Luanda',
  })
  city?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Província',
    example: 'Luanda',
  })
  province?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'País',
    example: 'Angola',
  })
  country?: string;
}
