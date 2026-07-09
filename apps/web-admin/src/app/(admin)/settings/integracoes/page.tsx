'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, RefreshCw, TestTube, Trash2 } from 'lucide-react';
import type { ApiIntegration, ApiIntegrationType } from '@uritech/shared';
import { settingsApi } from '@/lib/api';
import styles from '../../dashboard.module.css';

const TYPE_LABELS: Record<ApiIntegrationType, string> = {
  payment: 'Pagamentos',
  maps: 'Mapas',
  sms: 'SMS',
  email: 'Email',
  analytics: 'Analytics',
  push: 'Push Notifications',
  other: 'Outros',
};

const emptyForm: {
  name: string;
  type: ApiIntegrationType;
  provider: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  merchantId: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
} = {
  name: '',
  type: 'payment',
  provider: '',
  apiKey: '',
  apiSecret: '',
  webhookUrl: '',
  merchantId: '',
  environment: 'sandbox',
  enabled: false,
};

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = () => {
    settingsApi.getIntegrations()
      .then(setIntegrations)
      .catch(() => setMessage('Erro ao carregar integrações. Inicie o backend.'));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? integrations : integrations.filter((i) => i.type === filter);

  const handleSave = async () => {
    try {
      if (editingId) {
        await settingsApi.updateIntegration(editingId, form);
      } else {
        await settingsApi.createIntegration(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
      setMessage('Integração guardada.');
    } catch {
      setMessage('Erro ao guardar integração.');
    }
  };

  const handleEdit = (item: ApiIntegration) => {
    setForm({
      name: item.name,
      type: item.type,
      provider: item.provider,
      apiKey: item.apiKey || '',
      apiSecret: item.apiSecret || '',
      webhookUrl: item.webhookUrl || '',
      merchantId: item.merchantId || '',
      environment: item.environment,
      enabled: item.enabled,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleToggle = async (id: string) => {
    await settingsApi.toggleIntegration(id);
    load();
  };

  const handleTest = async (id: string) => {
    const result = await settingsApi.testIntegration(id);
    setMessage(result.message);
  };

  const handleDelete = async (id: string) => {
    await settingsApi.deleteIntegration(id);
    load();
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: 14, marginBottom: 8 }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1>Integrações de API</h1>
          <p>Configure gateways de pagamento, mapas, SMS, email e outras APIs</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Plus size={18} /> Nova Integração
        </button>
      </div>

      {message && (
        <div style={{ padding: 12, borderRadius: 10, marginBottom: 20, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'payment', 'maps', 'sms', 'email', 'push', 'analytics', 'other'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: filter === t ? 'var(--primary)' : 'var(--white)',
              color: filter === t ? 'white' : 'var(--gray-700)',
              border: '1px solid var(--gray-100)',
            }}
          >
            {t === 'all' ? 'Todas' : TYPE_LABELS[t as ApiIntegrationType]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editingId ? 'Editar' : 'Nova'} Integração</h2>
          <div className={styles.grid}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Nome</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ApiIntegrationType })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Provider / Slug</label>
              <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Ambiente</label>
              <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as 'sandbox' | 'production' })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }}>
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>API Key</label>
              <input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>API Secret</label>
              <input type="password" value={form.apiSecret} onChange={(e) => setForm({ ...form, apiSecret: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Merchant ID</label>
              <input value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Webhook URL</label>
              <input value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10 }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 14 }}>
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Activar integração
          </label>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={handleSave} style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: 10, fontWeight: 600 }}>Guardar</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--gray-100)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Integrações Configuradas ({filtered.length})</h2>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)' }}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>Nome</th><th>Tipo</th><th>Provider</th><th>Ambiente</th><th>Estado</th><th>Acções</th></tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>{TYPE_LABELS[item.type]}</td>
                <td><code style={{ fontSize: 12 }}>{item.provider}</code></td>
                <td>{item.environment}</td>
                <td>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={styles.statusBadge}
                    style={item.enabled ? { background: 'var(--primary-light)', color: 'var(--primary)' } : { background: 'var(--gray-100)', color: 'var(--gray-500)' }}
                  >
                    {item.enabled ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(item)} title="Editar" style={{ padding: 6, borderRadius: 6, background: 'var(--gray-50)' }}>✏️</button>
                    <button onClick={() => handleTest(item.id)} title="Testar" style={{ padding: 6, borderRadius: 6, background: 'var(--gray-50)' }}><TestTube size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} title="Remover" style={{ padding: 6, borderRadius: 6, background: '#FFF0F0', color: 'var(--error)' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
