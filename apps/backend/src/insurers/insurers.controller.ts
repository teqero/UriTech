import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { InsurersService } from './insurers.service';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';

@Controller('insurers')
export class InsurersController {
  constructor(private insurersService: InsurersService) {}

  @Public()
  @Get()
  findAll(@Query('active') active?: string) {
    return this.insurersService.findAll(active === 'true');
  }

  @Roles('admin')
  @Get('stats')
  getStats() {
    return this.insurersService.getPlatformStats();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insurersService.findById(id);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateInsurerDto) {
    return this.insurersService.create(dto);
  }

  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsurerDto) {
    return this.insurersService.update(id, dto);
  }

  @Roles('admin')
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.insurersService.toggleActive(id);
  }
}
