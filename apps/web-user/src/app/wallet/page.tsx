'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@uritech/shared';
import { WebShell, PrimaryButton, Card } from '@/components/WebShell';
import { fetchWallet } from '@/lib/wallet-api';

export default function WalletPage() {
  const [balance, setBalance] = useState(24500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet()
      .then((w) => setBalance(w.balance))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <WebShell title="UriPay" backHref="/profile">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>UriPay Wallet</h1>
      <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <p style={{ opacity: 0.9, margin: 0 }}>Saldo disponível</p>
        <p style={{ fontSize: 36, fontWeight: 800, margin: '8px 0 0' }}>
          {loading ? '…' : formatCurrency(balance)}
        </p>
      </div>
      <Card title="Carregar saldo" subtitle="Multicaixa Express, Unitel Money" onHref="/wallet/carregar" />
      <Card title="Transferir" subtitle="Enviar para outro UriGo" onHref="/wallet/transferir" />
      <Card title="Sacar" subtitle="Levantar para Multicaixa" onHref="/wallet/sacar" />
      <PrimaryButton href="/wallet/carregar">+ CARREGAR SALDO</PrimaryButton>
    </WebShell>
  );
}
