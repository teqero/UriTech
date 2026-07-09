import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, JwtUserPayload } from '../auth/current-user.decorator';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getSummary(@CurrentUser() user: JwtUserPayload) {
    return this.walletService.getSummary(user.userId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser() user: JwtUserPayload) {
    return this.walletService.getTransactions(user.userId);
  }

  @Post('topup')
  topUp(@CurrentUser() user: JwtUserPayload, @Body('amount') amount: number) {
    return this.walletService.topUp(user.userId, Number(amount));
  }

  @Post('transfer')
  transfer(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: { toEmail: string; amount: number },
  ) {
    return this.walletService.transfer(user.userId, body.toEmail, Number(body.amount));
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: JwtUserPayload, @Body('amount') amount: number) {
    return this.walletService.withdraw(user.userId, Number(amount));
  }
}
