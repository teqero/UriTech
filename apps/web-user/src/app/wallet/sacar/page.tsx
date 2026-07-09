'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell, PrimaryButton } from '@/components/WebShell';
import { withdrawWallet } from '@/lib/wallet-api';

export default function SacarWalletPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');
    try {
      await withdrawWallet(Number(amount) || 0);
      router.push('/wallet');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Levantamento falhou');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WebShell title="Sacar" backHref="/wallet">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Sacar</h1>
      <p style={{ color: 'var(--gray-500)' }}>Método: Multicaixa Express · Taxa 100 Kz</p>
      <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Valor (Kz)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--gray-100)', marginTop: 8 }}
      />
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={loading}
        style={{ marginTop: 20, width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
      >
        {loading ? 'A processar…' : 'CONFIRMAR SAQUE'}
      </button>
      {error ? <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p> : null}
      <PrimaryButton href="/wallet">Voltar à carteira</PrimaryButton>
    </WebShell>
  );
}
