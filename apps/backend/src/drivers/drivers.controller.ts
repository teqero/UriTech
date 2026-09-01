import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { Body, Controller, Get, Patch, Param, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { DriversService } from './drivers.service';
import { UsersService } from '../users/users.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import type { Location } from '@uritech/shared';

@ApiTags('Drivers')
@ApiBearerAuth('JWT-auth')
@Controller('drivers')
export class DriversController {
  constructor(
    private driversService: DriversService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar motoristas' })
  @ApiResponse({ status: 200, description: 'Lista de motoristas' })
  findAll() {
    return this.driversService.findAll();
  }

  @Public()
  @Get('online')
  @ApiOperation({ summary: 'Motoristas online' })
  @ApiResponse({ status: 200, description: 'Motoristas disponíveis' })
  findOnline() {
    return this.driversService.findOnline();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do motorista' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Criar motorista', description: 'Cria conta de motorista (admin only)' })
  @ApiBody({ type: CreateDriverDto })
  @ApiResponse({ status: 201, description: 'Motorista criado' })
  async create(@Body() dto: CreateDriverDto) {
    const hashedPassword = await bcrypt.hash('urigo123', 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: 'driver',
      password: hashedPassword,
    });

    return this.driversService.create({
      userId: user.id,
      name: dto.name,
      phone: dto.phone,
      vehicleType: dto.vehicleType,
      vehiclePlate: dto.vehiclePlate,
    });
  }

  @Roles('admin')
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle online/offline', description: 'Altera estado do motorista (admin only)' })
  @ApiParam({ name: 'id' })
  toggleOnline(@Param('id') id: string) {
    return this.driversService.toggleOnline(id);
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Actualizar localização', description: 'Actualiza GPS do motorista' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } } })
  updateLocation(@Param('id') id: string, @Body() location: Location) {
    return this.driversService.updateLocation(id, location);
  }
}
