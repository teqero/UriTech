import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from './settings.service';
import { CreateIntegrationDto, UpdateBrandDto, UpdateIntegrationDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('brand')
  getBrand() {
    return this.settingsService.getBrand();
  }

  @Roles('admin')
  @Put('brand')
  updateBrand(@Body() body: UpdateBrandDto) {
    return this.settingsService.updateBrand(body);
  }

  @Roles('admin')
  @Get('integrations')
  getIntegrations(@Query('type') type?: string) {
    return this.settingsService.getIntegrations(type);
  }

  @Roles('admin')
  @Get('integrations/:id')
  getIntegration(@Param('id') id: string) {
    return this.settingsService.getIntegration(id);
  }

  @Roles('admin')
  @Post('integrations')
  createIntegration(@Body() body: CreateIntegrationDto) {
    return this.settingsService.createIntegration(body);
  }

  @Roles('admin')
  @Put('integrations/:id')
  updateIntegration(@Param('id') id: string, @Body() body: UpdateIntegrationDto) {
    return this.settingsService.updateIntegration(id, body);
  }

  @Roles('admin')
  @Patch('integrations/:id/toggle')
  toggleIntegration(@Param('id') id: string) {
    return this.settingsService.toggleIntegration(id);
  }

  @Roles('admin')
  @Post('integrations/:id/test')
  testIntegration(@Param('id') id: string) {
    return this.settingsService.testIntegration(id);
  }

  @Roles('admin')
  @Delete('integrations/:id')
  deleteIntegration(@Param('id') id: string) {
    const deleted = this.settingsService.deleteIntegration(id);
    return { success: deleted };
  }
}
