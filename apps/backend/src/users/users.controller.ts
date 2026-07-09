import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { UserRole } from '@uritech/shared';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll({ search, role });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password ?? 'urigo123', 10);
    return this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      password: hashedPassword,
    });
  }
}
