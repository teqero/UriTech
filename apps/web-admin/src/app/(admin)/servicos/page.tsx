'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ON_DEMAND_SERVICES, STORE_DELIVERY_CATEGORIES, SERVICES, formatCurrency } from '@uritech/shared';
import { catalogApi, paymentsApi } from '../../../lib/api';
import styles from '../dashboard.module.css';

type Tab = 'modules' | 'on-demand' | 'stores' | 'multicaixa';

export default function ServicosAdminPage() {
  const [tab, setTab] = useState<Tab>('on-demand');
  const [onDemand, setOnDemand] = useState(ON_DEMAND_SERVICES);
  const [stores, setStores] = useState(STORE_DELIVERY_CATEGORIES);
  const [search, setSearch] = useState('');
  const [multicaixa, setMulticaixa] = useState<{ enabled: boolean; status: string; webhookUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [od, sc, mc] = await Promise.all([
        catalogApi.getOnDemand(),
        catalogApi.getStoreCategories(),
        paymentsApi.getMulticaixaStatus(),
      ]);
      setOnDemand(od);
      setStores(sc);
      setMulticaixa({ enabled: mc.enabled, status: mc.status, webhookUrl: mc.webhookUrl });
    } catch {
      setError('API offline — a usar catálogo local. Inicie o backend (porta 4000).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return onDemand;
    return onDemand.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [onDemand, search]);

  const enabledCount = onDemand.filter((s) => s.enabled).length;

  async function toggleOnDemand(id: string) {
    try {
      const updated = await catalogApi.toggleOnDemand(id);
      if (updated) setOnDemand((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setOnDemand((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      );
    }
  }

  async function toggleStore(id: string) {
    try {
      const updated = await catalogApi.toggleStoreCategory(id);
      if (updated) setStores((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setStores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
      );
    }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Gestão de Serviços</h1>
          <p>52 on-demand · 10 categorias loja · módulos base · Multicaixa</p>
        </div>
        <button type="button" onClick={load} style={{ background: 'var(--gray-100)', padding: '10px 16px', borderRadius: 10, fontWeight: 600 }}>
          Actualizar
        </button>
      </div>

      {error ? (
        <div className={styles.card} style={{ marginBottom: 16, borderColor: '#f59e0b', background: '#fffbeb' }}>
          <p style={{ fontSize: 13, color: '#92400e' }}>{error}</p>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {([
          ['on-demand', `On-demand (${enabledCount}/${onDemand.length})`],
          ['stores', `Lojas (${stores.filter((c) => c.enabled).length}/10)`],
          ['modules', 'Módulos base'],
          ['multicaixa', 'Multicaixa'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 13,
              background: tab === key ? 'var(--primary)' : 'var(--gray-100)',
              color: tab === key ? 'white' : 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'on-demand' && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar serviço ou categoria…"
            style={{ width: '100%', maxWidth: 400, padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, marginBottom: 16 }}
          />
          <div className={styles.card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {filtered.map((service) => (
                <div
                  key={service.id}
                  style={{
                    border: '1px solid var(--gray-100)',
                    borderRadius: 12,
                    padding: 14,
                    opacity: service.enabled ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{service.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>{service.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleOnDemand(service.id)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: service.enabled ? '#dcfce7' : '#fee2e2',
                        color: service.enabled ? '#166534' : '#991b1b',
                      }}
                    >
                      {service.enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, marginTop: 8, color: 'var(--gray-500)' }}>
                    {service.providersCount} prestadores · desde {formatCurrency(service.priceFrom)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'stores' && (
        <div className={styles.card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>10 categorias de entrega (Gojek-style)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {stores.map((cat) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <span style={{ fontWeight: 600 }}>{cat.icon} {cat.name}</span>
                <button type="button" onClick={() => toggleStore(cat.id)} style={{ fontSize: 11, fontWeight: 700, color: cat.enabled ? 'var(--primary)' : 'var(--gray-500)' }}>
                  {cat.enabled ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'modules' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {SERVICES.map((mod) => (
            <div key={mod.id} className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{mod.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{mod.name}</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{mod.description}</p>
              <p style={{ fontSize: 11, marginTop: 8, color: '#166534', fontWeight: 700 }}>ACTIVO</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'multicaixa' && (
        <div className={styles.card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Multicaixa Express</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
            Webhook: <code>{multicaixa?.webhookUrl ?? '/api/v1/payments/multicaixa/webhook'}</code>
          </p>
          <p style={{ fontSize: 14 }}>
            Estado:{' '}
            <strong style={{ color: multicaixa?.enabled ? '#166534' : '#991b1b' }}>
              {loading ? '…' : multicaixa?.enabled ? 'ACTIVO' : 'INACTIVO'} ({multicaixa?.status ?? 'inactive'})
            </strong>
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 12 }}>
            Configure credenciais em Settings → Integrações. Um webhook com status <code>paid</code> activa automaticamente a integração.
          </p>
        </div>
      )}
    </div>
  );
}
