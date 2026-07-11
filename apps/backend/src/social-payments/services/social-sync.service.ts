import { Injectable } from '@nestjs/common';
import type { SocialPaymentSyncStatus, SocialPlatform } from '@uritech/shared';
import type { PlatformInfo } from './platform-detector.service';

export interface SyncResult {
  syncStatus: SocialPaymentSyncStatus;
  syncMessage: string;
  soldBadge: boolean;
}

@Injectable()
export class SocialSyncService {
  evaluate(platformInfo: PlatformInfo, originalUrl: string): SyncResult {
    if (platformInfo.syncSupported && platformInfo.hasOfficialApi) {
      return {
        syncStatus: 'pending',
        syncMessage: `Sincronização automática com ${platformInfo.label} será tentada após confirmação do vendedor.`,
        soldBadge: false,
      };
    }

    return {
      syncStatus: 'manual_required',
      syncMessage: `Recebemos o pagamento deste produto. Abra o anúncio em ${platformInfo.label} e marque-o como vendido.`,
      soldBadge: false,
    };
  }

  markSynced(platform: SocialPlatform): SyncResult {
    return {
      syncStatus: 'synced',
      syncMessage: `Produto marcado como vendido${platform !== 'other' ? ` em ${platform}` : ''}.`,
      soldBadge: true,
    };
  }

  buildSellerNotification(params: {
    buyerName: string;
    productTitle: string;
    amount: number;
    transactionCode: string;
    originalUrl: string;
    platformLabel: string;
  }): { title: string; body: string } {
    return {
      title: 'Pagamento UriPay recebido',
      body: `${params.buyerName} pagou ${params.amount.toLocaleString('pt-AO')} Kz por "${params.productTitle}". Código: ${params.transactionCode}. Confirme a entrega em ${params.platformLabel}.`,
    };
  }

  sellerActionUrl(originalUrl: string): string {
    return originalUrl;
  }
}
