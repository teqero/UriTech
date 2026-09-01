import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { Body, Controller, Get, Patch, Param, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';
import { UsersService } from '../users/users.service';
import { CreateVendorDto } from './dto/create-vendor.dto';

@ApiTags('Vendors')
@ApiBearerAuth('JWT-auth')
@Controller('vendors')
export class VendorsController {
  constructor(
    private vendorsService: VendorsService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar lojistas' })
  @ApiResponse({ status: 200, description: 'Lista de lojistas' })
  findAll() {
    return this.vendorsService.findAll();
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Criar lojista', description: 'Cria conta de lojista (admin only)' })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({ status: 201, description: 'Lojista criado' })
  async create(@Body() dto: CreateVendorDto) {
    const hashedPassword = await bcrypt.hash('urigo123', 10);
    const user = await this.usersService.create({
      name: dto.storeName,
      email: dto.email,
      phone: dto.phone,
      role: 'vendor',
      password: hashedPassword,
    });

    return this.vendorsService.create({
      userId: user.id,
      businessName: dto.storeName,
      address: dto.storeAddress,
      city: 'Luanda',
      country: 'Angola',
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do lojista' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Roles('admin')
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Abrir/fechar loja', description: 'Alterna estado da loja (admin only)' })
  @ApiParam({ name: 'id' })
  toggleOpen(@Param('id') id: string) {
    return this.vendorsService.toggleOpen(id);
  }
}
