import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import {
  CheckoutSocialPaymentDto,
  ImportProductDto,
  PaySocialPaymentDto,
  UpdateSocialPaymentDto,
} from './dto/social-payment.dto';
import { SocialPaymentsService } from './social-payments.service';

@Controller('social-payments')
export class SocialPaymentsController {
  constructor(private readonly socialPaymentsService: SocialPaymentsService) {}

  @Post('import')
  async importProduct(@Body() body: ImportProductDto, @CurrentUser() user: JwtUserPayload) {
    if (user.role !== 'user') {
      throw new ForbiddenException('Apenas clientes podem pagar produtos por link');
    }
    return this.socialPaymentsService.importProduct(user.userId, body.url);
  }

  @Get()
  listMine(@CurrentUser() user: JwtUserPayload) {
    return this.socialPaymentsService.listByBuyer(user.userId);
  }

  /** Proxy OG images — must be registered before `:id` */
  @Public()
  @Get('image')
  async proxyImage(@Query('url') url: string | undefined, @Res() res: Response) {
    if (!url?.startsWith('http')) {
      throw new BadRequestException('URL de imagem inválida');
    }
    const proxied = await this.socialPaymentsService.proxyImage(url);
    res.set({
      'Content-Type': proxied.contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(proxied.buffer);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.socialPaymentsService.getById(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateSocialPaymentDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.socialPaymentsService.updateProduct(id, user.userId, body);
  }

  @Post(':id/checkout')
  checkout(
    @Param('id') id: string,
    @Body() body: CheckoutSocialPaymentDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.socialPaymentsService.prepareCheckout(id, user.userId, body);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body() body: PaySocialPaymentDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.socialPaymentsService.pay(id, user.userId, body);
  }

  @Post(':id/sync')
  sync(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.socialPaymentsService.resyncFromUrl(id, user.userId);
  }
}
