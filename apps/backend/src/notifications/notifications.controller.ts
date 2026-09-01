import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RegisterWebPushDto } from './dto/register-web-push.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get('web-push/config')
  @ApiOperation({ summary: 'Config Web Push', description: 'Devolve chave pública VAPID para web push' })
  @ApiResponse({ status: 200, description: 'Chave pública VAPID' })
  webPushConfig() {
    return this.notificationsService.getWebPushPublicKey();
  }

  @Post('register')
  @ApiOperation({ summary: 'Registar dispositivo', description: 'Regista token FCM/APNs para push notifications' })
  @ApiBody({ type: RegisterDeviceDto })
  @ApiResponse({ status: 201, description: 'Dispositivo registado' })
  register(@Body() body: RegisterDeviceDto, @CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.registerToken(user.userId, body.token, body.platform);
  }

  @Post('register-web')
  @ApiOperation({ summary: 'Registar web push', description: 'Regista subscrição web push (VAPID)' })
  @ApiBody({ type: RegisterWebPushDto })
  @ApiResponse({ status: 201, description: 'Subscrição registada' })
  registerWeb(@Body() body: RegisterWebPushDto, @CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.registerWebPush(user.userId, body.subscription);
  }

  @Roles('admin')
  @Get('devices')
  @ApiOperation({ summary: 'Listar dispositivos', description: 'Lista todos os dispositivos registados (admin only)' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos' })
  listDevices() {
    return this.notificationsService.listDevices();
  }
}
