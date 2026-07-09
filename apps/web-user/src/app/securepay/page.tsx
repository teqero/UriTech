'use client';

import { useState } from 'react';
import { formatCurrency } from '@uritech/shared';
import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

type Step = 'create' | 'code' | 'confirm';

export default function SecurePayPage() {
  const [step, setStep] = useState<Step>('create');
  const [mode, setMode] = useState<'urigo' | 'personal'>('urigo');

  if (step === 'code') {
    return (
      <WebShell title="SecurePay" backHref="/securepay">
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Código de Confirmação</h1>
        <p style={{ color: 'var(--gray-500)' }}>Guarde este código para confirmar a recepção.</p>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#6C63FF', letterSpacing: 6, textAlign: 'center', margin: '24px 0' }}>
          847 · 293
        </div>
        <Card title="Samsung Galaxy S24 Ultra" subtitle={`Carlos Manuel · ${formatCurrency(450000)}`} />
        <button
          type="button"
          onClick={() => setStep('confirm')}
          style={{ width: '100%', marginTop: 16, padding: 16, borderRadius: 12, border: 'none', background: '#6C63FF', color: 'white', fontWeight: 700 }}
        >
          SIMULAR CONFIRMAÇÃO
        </button>
      </WebShell>
    );
  }

  if (step === 'confirm') {
    return (
      <WebShell title="SecurePay">
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Pagamento libertado</h1>
        <p style={{ color: 'var(--gray-500)' }}>450.000 Kz transferidos ao vendedor após confirmação do código.</p>
        <PrimaryButton href="/">VOLTAR AO INÍCIO</PrimaryButton>
      </WebShell>
    );
  }

  return (
    <WebShell title="SecurePay">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Novo Pagamento Seguro</h1>
      <Card title="Samsung Galaxy S24 Ultra" subtitle="Vendedor: Carlos Manuel" />
      <p style={{ fontWeight: 700, fontSize: 28 }}>{formatCurrency(450000)}</p>
      <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
        <button type="button" onClick={() => setMode('urigo')} style={modeBtn(mode === 'urigo')}>
          Com Entrega UriGo
        </button>
        <button type="button" onClick={() => setMode('personal')} style={modeBtn(mode === 'personal')}>
          Sem Entrega UriGo
        </button>
      </div>
      <Card title="Taxa UriGo (5%)" subtitle={formatCurrency(22500)} />
      {mode === 'urigo' ? <Card title="Entrega" subtitle={formatCurrency(1500)} /> : null}
      <button
        type="button"
        onClick={() => setStep('code')}
        style={{ width: '100%', marginTop: 16, padding: 16, borderRadius: 12, border: 'none', background: '#6C63FF', color: 'white', fontWeight: 700 }}
      >
        DEPOSITAR NO ESCROW
      </button>
    </WebShell>
  );
}

function modeBtn(active: boolean) {
  return {
    textAlign: 'left' as const,
    padding: 16,
    borderRadius: 12,
    border: `1px solid ${active ? '#6C63FF' : 'var(--gray-100)'}`,
    background: active ? '#F5F4FF' : 'white',
    fontWeight: 700,
  };
}
