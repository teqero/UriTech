'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@uritech/shared';
import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

const LISTINGS = {
  imoveis: [
    { title: 'Vivenda T3, Talatona', price: 45_000_000, type: 'Venda' },
    { title: 'Apartamento T2, Kilamba', price: 350_000, type: 'Aluguer' },
    { title: 'Condomínio Roses, Morro Bento', price: 120_000_000, type: 'Venda' },
  ],
  carros: [
    { title: 'Toyota Corolla 2019', price: 8_500_000, type: 'Venda' },
    { title: 'Honda Fit 2021', price: 12_000_000, type: 'Venda' },
  ],
  itens: [
    { title: 'iPhone 15 Pro', price: 1_200_000, type: 'Venda' },
    { title: 'Sofá 3 lugares', price: 180_000, type: 'Venda' },
  ],
};

export default function MarketplacePage() {
  const [tab, setTab] = useState<'imoveis' | 'carros' | 'itens'>('imoveis');
  const [type, setType] = useState<'all' | 'Venda' | 'Aluguer'>('all');

  const items = useMemo(() => {
    return LISTINGS[tab].filter((i) => (type === 'all' ? true : i.type === type));
  }, [tab, type]);

  return (
    <WebShell title="Marketplace">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Marketplace UriGo</h1>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        {(['imoveis', 'carros', 'itens'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid var(--gray-100)',
              background: tab === t ? '#EEEDFF' : 'white',
              fontWeight: 700,
              color: tab === t ? '#6C63FF' : 'inherit',
            }}
          >
            {t === 'imoveis' ? 'Imóveis' : t === 'carros' ? 'Carros' : 'Itens'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'Venda', 'Aluguer'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid var(--gray-100)',
              background: type === t ? '#E8F5E9' : 'white',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t === 'all' ? 'Todos' : t}
          </button>
        ))}
      </div>
      <p style={{ fontWeight: 700, marginBottom: 12 }}>{items.length} resultados</p>
      {items.map((item) => (
        <Card key={item.title} title={`${formatCurrency(item.price)} · ${item.type}`} subtitle={item.title} />
      ))}
      <PrimaryButton href="/securepay">ANUNCIAR / COMPRAR COM SECUREPAY</PrimaryButton>
    </WebShell>
  );
}
