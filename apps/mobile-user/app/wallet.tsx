import { Redirect } from 'expo-router';
import { routes } from '../lib/navigation';

/** Alias Figma «UriGo – UriPay Wallet» → tab Pagamento */
export default function WalletAlias() {
  return <Redirect href={routes.payment} />;
}
