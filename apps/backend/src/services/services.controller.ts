import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { SERVICES, PROMO_BANNERS } from '@uritech/shared';
import { CatalogService } from './catalog.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get()
  findAll() {
    return SERVICES;
  }

  @Public()
  @Get('promos')
  getPromos() {
    return PROMO_BANNERS;
  }

  @Public()
  @Get('on-demand')
  getOnDemand() {
    return this.catalogService.getOnDemand();
  }

  @Public()
  @Get('store-categories')
  getStoreCategories() {
    return this.catalogService.getStoreCategories();
  }

  @Roles('admin')
  @Patch('on-demand/:id/toggle')
  toggleOnDemand(@Param('id') id: string) {
    return this.catalogService.toggleOnDemand(id);
  }

  @Roles('admin')
  @Patch('store-categories/:id/toggle')
  toggleStoreCategory(@Param('id') id: string) {
    return this.catalogService.toggleStoreCategory(id);
  }

  @Roles('admin')
  @Patch('on-demand/:id')
  updateOnDemand(
    @Param('id') id: string,
    @Body() body: { priceFrom?: number; enabled?: boolean },
  ) {
    return this.catalogService.updateOnDemand(id, body);
  }
}
