import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { InsurersService } from './insurers.service';
import { CreateInsurerDto } from './dto/create-insurer.dto';
import { UpdateInsurerDto } from './dto/update-insurer.dto';

@ApiTags('Insurers')
@ApiBearerAuth('JWT-auth')
@Controller('insurers')
export class InsurersController {
  constructor(private insurersService: InsurersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar seguradoras' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar apenas activas' })
  @ApiResponse({ status: 200, description: 'Lista de seguradoras' })
  findAll(@Query('active') active?: string) {
    return this.insurersService.findAll(active === 'true');
  }

  @Roles('admin')
  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas', description: 'Estatísticas da plataforma (admin only)' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  getStats() {
    return this.insurersService.getPlatformStats();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da seguradora' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.insurersService.findById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Criar seguradora', description: 'Adiciona nova seguradora (admin only)' })
  @ApiBody({ type: CreateInsurerDto })
  @ApiResponse({ status: 201, description: 'Seguradora criada' })
  create(@Body() dto: CreateInsurerDto) {
    return this.insurersService.create(dto);
  }

  @Roles('admin')
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar seguradora', description: 'Actualiza dados da seguradora (admin only)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateInsurerDto })
  update(@Param('id') id: string, @Body() dto: UpdateInsurerDto) {
    return this.insurersService.update(id, dto);
  }

  @Roles('admin')
  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activar/desactivar', description: 'Alterna estado da seguradora (admin only)' })
  @ApiParam({ name: 'id' })
  toggle(@Param('id') id: string) {
    return this.insurersService.toggleActive(id);
  }
}
