import { Body, Controller, Get, Patch, Param, Post } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';
import { UsersService } from '../users/users.service';
import { CreateVendorDto } from './dto/create-vendor.dto';

@Controller('vendors')
export class VendorsController {
  constructor(
    private vendorsService: VendorsService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Roles('admin')
  @Post()
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
      storeName: dto.storeName,
      storeAddress: dto.storeAddress,
      categories: dto.categories,
      isOpen: dto.isOpen ?? true,
    });
  }

  @Public()
  @Get(':id/menu')
  getMenu(@Param('id') id: string) {
    return this.vendorsService.getMenu(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Roles('admin')
  @Patch(':id/toggle')
  toggleOpen(@Param('id') id: string) {
    return this.vendorsService.toggleOpen(id);
  }
}
