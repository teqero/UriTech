import { Alert, Share } from 'react-native';
import { formatCurrency } from '@uritech/shared';
import type { MarketplaceListing, MarketplaceTab } from './marketplace-filters';
import { navigateTo } from './navigation';
import { confirmServiceOrder } from './service-checkout';

export async function shareOrderReference(params: {
  service?: string;
  ref?: string;
  dest?: string;
  amount?: string;
}) {
  const lines = [
    'Pedido UriGo confirmado!',
    params.service ? `Serviço: ${params.service}` : null,
    params.ref ? `Referência: ${params.ref}` : null,
    params.dest ? `Destino: ${params.dest}` : null,
    params.amount ? `Valor: ${params.amount} Kz` : null,
  ].filter(Boolean);
  const message = lines.join('\n');

  try {
    await Share.share({ message, title: 'Pedido UriGo' });
  } catch {
    Alert.alert('Partilhar pedido', message);
  }
}

export function openMarketplaceListing(item: MarketplaceListing, tabKey: MarketplaceTab) {
  const priceLabel = formatCurrency(item.price);
  const typeLabel = item.type === 'venda' ? 'Venda' : 'Aluguer';

  if (tabKey === 'itens') {
    Alert.alert(item.title, `${typeLabel} · ${priceLabel}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'SecurePay', onPress: () => navigateTo('/escrow') },
      {
        text: 'Comprar',
        onPress: () => void confirmServiceOrder({
          service: 'marketplace',
          dest: item.title,
          label: item.title,
          amount: item.price,
        }),
      },
    ]);
    return;
  }

  const service = tabKey === 'carros' ? 'carros' : 'imoveis';
  Alert.alert(item.title, `${item.city} · ${typeLabel} · ${priceLabel}`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'SecurePay', onPress: () => navigateTo('/escrow') },
    {
      text: 'Tenho interesse',
      onPress: () => void confirmServiceOrder({
        service,
        dest: item.title,
        label: item.title,
        amount: item.price,
      }),
    },
  ]);
}

export function announceMarketplaceListing(tabLabel: string, tabKey: MarketplaceTab) {
  const service = tabKey === 'carros' ? 'carros' : tabKey === 'itens' ? 'marketplace' : 'imoveis';
  Alert.alert(
    'Publicar anúncio',
    `Publique em ${tabLabel} com verificação SecurePay (taxa: ${formatCurrency(5000)}).`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Publicar',
        onPress: () => void confirmServiceOrder({
          service,
          dest: tabLabel,
          label: `Anúncio Marketplace — ${tabLabel}`,
          amount: 5000,
        }),
      },
      { text: 'SecurePay', onPress: () => navigateTo('/escrow') },
    ],
  );
}
