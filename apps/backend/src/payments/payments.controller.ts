import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { PaymentsService } from './payments.service';
import { InitiateMulticaixaDto, MulticaixaWebhookDto, SimulateMulticaixaDto } from './dto/multicaixa.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('multicaixa/initiate')
  initiateTopup(@Body() body: InitiateMulticaixaDto, @CurrentUser() user: JwtUserPayload) {
    return this.paymentsService.initiateWalletTopup(user.userId, body);
  }

  @Post('multicaixa/simulate')
  simulateTopup(@Body() body: SimulateMulticaixaDto, @CurrentUser() user: JwtUserPayload) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Simulação indisponível em produção' };
    }
    return this.paymentsService.simulateWalletTopup(user.userId, body.reference);
  }

  @Public()
  @Post('multicaixa/webhook')
  multicaixaWebhook(@Body() body: MulticaixaWebhookDto) {
    return this.paymentsService.handleMulticaixaWebhook(body);
  }

  @Roles('admin')
  @Get('multicaixa/status')
  multicaixaStatus() {
    return this.paymentsService.getMulticaixaStatus();
  }

  @Roles('admin')
  @Get('multicaixa/transactions')
  multicaixaTransactions() {
    return this.paymentsService.getMulticaixaTransactions();
  }
}
