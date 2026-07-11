import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { ImportProductDto, CheckoutSocialPaymentDto, PaySocialPaymentDto } from './dto/social-payment.dto';
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

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.socialPaymentsService.getById(id, user.userId);
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
    return this.socialPaymentsService.markSynced(id, user.userId);
  }
}
