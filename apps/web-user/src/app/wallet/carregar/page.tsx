'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WebShell, PrimaryButton } from '@/components/WebShell';
import { initiateMulticaixaTopup, simulateMulticaixaTopup, topUpWallet } from '@/lib/wallet-api';

export default function CarregarWalletPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);

  const value = Number(amount) || 0;

  const handleMulticaixa = async () => {
    setLoading(true);
    setError('');
    try {
      const init = await initiateMulticaixaTopup(value);
      setReference(init.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!reference) return;
    setLoading(true);
    setError('');
    try {
      await simulateMulticaixaTopup(reference);
      router.push('/wallet');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulação falhou');
    } finally {
      setLoading(false);
    }
  };

  const handleInstant = async () => {
    setLoading(true);
    setError('');
    try {
      await topUpWallet(value);
      router.push('/wallet');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Carregamento falhou');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WebShell title="Carregar Saldo" backHref="/wallet">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Carregar UriPay</h1>
      <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Valor (Kz)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--gray-100)', marginTop: 8 }}
      />
      <p style={{ marginTop: 16, color: 'var(--gray-500)' }}>Método: Multicaixa Express</p>
      {reference ? (
        <div style={{ marginTop: 16, padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Referência: {reference}</p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
            Pague no Multicaixa Express. Em desenvolvimento, simule abaixo.
          </p>
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading}
            style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Simular pagamento confirmado
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleMulticaixa}
          disabled={loading || value < 100}
          style={{ marginTop: 20, width: '100%', padding: 14, borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          {loading ? 'A processar…' : 'GERAR REFERÊNCIA MULTICAIXA'}
        </button>
      )}
      <button
        type="button"
        onClick={handleInstant}
        disabled={loading || value < 100}
        style={{ marginTop: 12, width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--gray-100)', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
      >
        Carregamento instantâneo (demo)
      </button>
      {error ? <p style={{ color: '#dc2626', marginTop: 12 }}>{error}</p> : null}
      <PrimaryButton href="/wallet">Voltar à carteira</PrimaryButton>
    </WebShell>
  );
}
