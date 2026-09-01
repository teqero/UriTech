import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { FinancialThrottlerGuard } from '../common/guards/financial-throttler.guard';
import { WalletService } from './wallet.service';
import { PayWalletDto, TopUpWalletDto, TransferWalletDto, WithdrawWalletDto, WalletSummaryDto } from './dto/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth('JWT-auth')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Resumo da carteira', description: 'Devolve saldo, moeda e máscara do cartão' })
  @ApiResponse({ status: 200, description: 'Resumo da carteira', type: WalletSummaryDto })
  getSummary(@CurrentUser() user: JwtUserPayload) {
    return this.walletService.getSummary(user.userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Transações', description: 'Lista histórico de transações da carteira' })
  @ApiResponse({ status: 200, description: 'Lista de transações' })
  getTransactions(@CurrentUser() user: JwtUserPayload) {
    return this.walletService.getTransactions(user.userId);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Carregar saldo', description: 'Adiciona saldo à carteira via Multicaixa Express' })
  @ApiBody({ type: TopUpWalletDto })
  @ApiResponse({ status: 201, description: 'Saldo carregado com sucesso', type: WalletSummaryDto })
  @ApiResponse({ status: 400, description: 'Valor inválido' })
  topUp(@CurrentUser() user: JwtUserPayload, @Body() dto: TopUpWalletDto) {
    return this.walletService.topUp(user.userId, dto.amount);
  }

  @Post('transfer')
  @UseGuards(FinancialThrottlerGuard)
  @ApiOperation({ summary: 'Transferir saldo', description: 'Transfere saldo para outro utilizador por email' })
  @ApiBody({ type: TransferWalletDto })
  @ApiResponse({ status: 201, description: 'Transferência bem-sucedida', type: WalletSummaryDto })
  @ApiResponse({ status: 400, description: 'Valor inválido ou saldo insuficiente' })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  transfer(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: TransferWalletDto,
  ) {
    return this.walletService.transfer(user.userId, dto.toEmail, dto.amount);
  }

  @Post('withdraw')
  @UseGuards(FinancialThrottlerGuard)
  @ApiOperation({ summary: 'Sacar saldo', description: 'Levanta saldo para conta bancária' })
  @ApiBody({ type: WithdrawWalletDto })
  @ApiResponse({ status: 201, description: 'Saque bem-sucedido', type: WalletSummaryDto })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  withdraw(@CurrentUser() user: JwtUserPayload, @Body() dto: WithdrawWalletDto) {
    return this.walletService.withdraw(user.userId, dto.amount);
  }

  @Post('pay')
  @UseGuards(FinancialThrottlerGuard)
  @ApiOperation({ summary: 'Efectuar pagamento', description: 'Paga um serviço ou produto com saldo da carteira' })
  @ApiBody({ type: PayWalletDto })
  @ApiResponse({ status: 201, description: 'Pagamento bem-sucedido', type: WalletSummaryDto })
  @ApiResponse({ status: 429, description: 'Rate limit excedido' })
  pay(@CurrentUser() user: JwtUserPayload, @Body() dto: PayWalletDto) {
    return this.walletService.pay(user.userId, dto.amount, dto.description);
  }
}
