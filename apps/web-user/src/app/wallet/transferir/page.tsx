'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell, PrimaryButton } from '@/components/WebShell';
import { transferWallet } from '@/lib/wallet-api';

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: '1px solid var(--gray-100)',
  marginTop: 8,
} as const;

export default function TransferirWalletPage() {
  const router = useRouter();
  const [email, setEmail] = useState('maria@uritech.com');
  const [amount, setAmount] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    setLoading(true);
    setError('');
    try {
      await transferWallet(email.trim(), Number(amount) || 0);
      router.push('/wallet');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transferência falhou');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WebShell title="Transferir" backHref="/wallet">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Transferir</h1>
      <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Email UriGo do destinatário</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Valor (Kz)</label>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
      <button
        type="button"
        onClick={handleTransfer}
        disabled={loading}
        style={{ marginTop: 20, width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
      >
        {loading ? 'A transferir…' : 'TRANSFERIR AGORA'}
      </button>
      {error ? <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p> : null}
      <PrimaryButton href="/wallet">Voltar à carteira</PrimaryButton>
    </WebShell>
  );
}
