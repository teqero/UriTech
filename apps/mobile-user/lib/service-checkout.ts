import { Alert } from 'react-native';
import { router } from 'expo-router';
import { loadAuthSession } from './auth-storage';
import { createServiceOrder } from './orders-api';
import { navigateToOrderConfirmed } from './navigation';

export interface ConfirmServiceOrderParams {
  service: string;
  dest?: string;
  label?: string;
  amount: number;
  deliveryFee?: number;
  items?: { name: string; quantity: number; price: number; menuItemId?: string }[];
  payWithWallet?: boolean;
}

export async function confirmServiceOrder(params: ConfirmServiceOrderParams): Promise<void> {
  const session = await loadAuthSession();
  if (!session) {
    router.push('/(auth)/signin' as never);
    return;
  }

  const deliveryFee = params.deliveryFee ?? 0;
  const itemPrice = Math.max(1, params.amount - deliveryFee);

  try {
    const order = await createServiceOrder({
      serviceKey: params.service,
      serviceName: params.label ?? params.service,
      total: params.amount,
      deliveryFee,
      destinationLabel: params.dest,
      payWithWallet: params.payWithWallet ?? true,
      items: params.items ?? [
        {
          name: params.label ?? `Pedido — ${params.service}`,
          quantity: 1,
          price: itemPrice,
          menuItemId: params.service,
        },
      ],
    });

    navigateToOrderConfirmed({
      service: params.service,
      dest: params.dest ?? '',
      label: params.label,
      amount: String(params.amount),
      ref: order.id,
    });
  } catch (e) {
    Alert.alert('Pedido', e instanceof Error ? e.message : 'Não foi possível confirmar o pedido');
  }
}
