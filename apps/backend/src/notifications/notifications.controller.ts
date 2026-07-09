import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RegisterWebPushDto } from './dto/register-web-push.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get('web-push/config')
  webPushConfig() {
    return this.notificationsService.getWebPushPublicKey();
  }

  @Post('register')
  register(@Body() body: RegisterDeviceDto, @CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.registerToken(user.userId, body.token, body.platform);
  }

  @Post('register-web')
  registerWeb(@Body() body: RegisterWebPushDto, @CurrentUser() user: JwtUserPayload) {
    return this.notificationsService.registerWebPush(user.userId, body.subscription);
  }

  @Roles('admin')
  @Get('devices')
  listDevices() {
    return this.notificationsService.listDevices();
  }
}
