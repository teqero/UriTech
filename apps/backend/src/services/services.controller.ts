import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { SERVICES, PROMO_BANNERS } from '@uritech/shared';
import { isDatabaseEnabled } from '../database/database.config';
import { CatalogService } from './catalog.service';
import { HealthService } from '../health/health.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly healthService: HealthService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health Check', description: 'Verifica estado de Postgres, Redis e MinIO' })
  @ApiResponse({ status: 200, description: 'Serviço disponível' })
  @ApiResponse({ status: 503, description: 'Um ou mais serviços indisponíveis' })
  async health() {
    return this.healthService.check();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar serviços', description: 'Devolve lista de todos os serviços disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  findAll() {
    return SERVICES;
  }

  @Public()
  @Get('promos')
  @ApiOperation({ summary: 'Promoções', description: 'Devolve banners promocionais ativos' })
  @ApiResponse({ status: 200, description: 'Banners promocionais' })
  getPromos() {
    return PROMO_BANNERS;
  }

  @Public()
  @Get('on-demand')
  @ApiOperation({ summary: 'Serviços On-Demand', description: 'Devolve serviços sob demanda (taxi, entrega, etc.)' })
  @ApiResponse({ status: 200, description: 'Serviços on-demand' })
  getOnDemand() {
    return this.catalogService.getOnDemand();
  }

  @Public()
  @Get('store-categories')
  @ApiOperation({ summary: 'Categorias de lojas', description: 'Devolve categorias de estabelecimentos' })
  @ApiResponse({ status: 200, description: 'Categorias de lojas' })
  getStoreCategories() {
    return this.catalogService.getStoreCategories();
  }

  @Roles('admin')
  @Patch('on-demand/:id/toggle')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle serviço on-demand', description: 'Ativa/desativa um serviço (admin only)' })
  @ApiResponse({ status: 200, description: 'Estado alterado' })
  toggleOnDemand(@Param('id') id: string) {
    return this.catalogService.toggleOnDemand(id);
  }

  @Roles('admin')
  @Patch('store-categories/:id/toggle')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle categoria', description: 'Ativa/desativa uma categoria de loja (admin only)' })
  @ApiResponse({ status: 200, description: 'Estado alterado' })
  toggleStoreCategory(@Param('id') id: string) {
    return this.catalogService.toggleStoreCategory(id);
  }

  @Roles('admin')
  @Patch('on-demand/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar serviço', description: 'Actualiza preço ou estado de um serviço (admin only)' })
  @ApiResponse({ status: 200, description: 'Serviço actualizado' })
  updateOnDemand(
    @Param('id') id: string,
    @Body() body: { priceFrom?: number; enabled?: boolean },
  ) {
    return this.catalogService.updateOnDemand(id, body);
  }
}
