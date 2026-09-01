import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import type { UserRole } from '@uritech/shared';

export class LoginDto {
  @ApiProperty({ example: 'joao@uritech.com', description: 'Email do utilizador' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha123', description: 'Palavra-passe (mín. 6 caracteres)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'joao@uritech.com', description: 'Email único' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha123', description: 'Palavra-passe (mín. 6 caracteres)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: '+244923456789', description: 'Telefone com código de país' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'user',
    description: 'Papel do utilizador',
    enum: ['user', 'driver', 'vendor', 'admin', 'delivery_rider', 'service_provider', 'corporate', 'restaurant', 'pharmacy', 'supermarket', 'store'],
  })
  @IsEnum(['user', 'driver', 'vendor', 'admin', 'delivery_rider', 'service_provider', 'corporate', 'restaurant', 'pharmacy', 'supermarket', 'store'])
  role!: UserRole;
}

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token obtido no login' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  refreshToken!: string;

  @ApiProperty({
    example: { id: 'user-1', name: 'João Silva', email: 'joao@uritech.com', role: 'user' },
  })
  user!: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
