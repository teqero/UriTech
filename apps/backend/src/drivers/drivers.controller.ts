import { Body, Controller, Get, Patch, Param, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { DriversService } from './drivers.service';
import { UsersService } from '../users/users.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import type { Location } from '@uritech/shared';

@Controller('drivers')
export class DriversController {
  constructor(
    private driversService: DriversService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.driversService.findAll();
  }

  @Public()
  @Get('online')
  findOnline() {
    return this.driversService.findOnline();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Roles('admin')
  @Post()
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
      isOnline: dto.isOnline ?? false,
    });
  }

  @Roles('admin')
  @Patch(':id/toggle')
  toggleOnline(@Param('id') id: string) {
    return this.driversService.toggleOnline(id);
  }

  @Patch(':id/location')
  updateLocation(@Param('id') id: string, @Body() location: Location) {
    return this.driversService.updateLocation(id, location);
  }
}
