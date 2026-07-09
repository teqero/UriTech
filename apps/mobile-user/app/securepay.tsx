import { Redirect } from 'expo-router';

/** Alias SecurePay → fluxo Escrow multi-passo (Figma Escrow 1–3) */
export default function SecurePayRoute() {
  return <Redirect href="/escrow" />;
}
