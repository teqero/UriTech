'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Shield } from 'lucide-react';
import { insurersApi, claimEvidenceApi, type AdminInsurer, type InsurerPlatformStats } from '@/lib/api';
import type { ClaimEvidenceReport } from '@uritech/shared';
import { Modal, FormField, FormInput, FormActions } from '@/components/Modal';
import { formatCurrency } from '@uritech/shared';
import styles from '../dashboard.module.css';

const emptyForm = {
  name: '',
  code: '',
  contactEmail: '',
  contactPhone: '',
  apiWebhookUrl: '',
  platformFeePerClaim: '2500',
  platformFeeMonthly: '0',
  active: true,
  mandatedForClients: false,
};

export default function SeguradorasPage() {
  const [insurers, setInsurers] = useState<AdminInsurer[]>([]);
  const [stats, setStats] = useState<InsurerPlatformStats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminInsurer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [claims, setClaims] = useState<ClaimEvidenceReport[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, platformStats, recentClaims] = await Promise.all([
        insurersApi.list(),
        insurersApi.stats(),
        claimEvidenceApi.list(),
      ]);
      setInsurers(list);
      setStats(platformStats);
      setClaims(recentClaims);
    } catch {
      setMessage('Erro ao carregar seguradoras. Inicie o backend na porta 4000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return insurers.filter((i) => {
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.contactEmail.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && i.active) ||
        (statusFilter === 'inactive' && !i.active);
      return matchesSearch && matchesStatus;
    });
  }, [insurers, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (insurer: AdminInsurer) => {
    setEditing(insurer);
    setForm({
      name: insurer.name,
      code: insurer.code,
      contactEmail: insurer.contactEmail,
      contactPhone: insurer.contactPhone,
      apiWebhookUrl: insurer.apiWebhookUrl ?? '',
      platformFeePerClaim: String(insurer.platformFeePerClaim),
      platformFeeMonthly: String(insurer.platformFeeMonthly),
      active: insurer.active,
      mandatedForClients: insurer.mandatedForClients,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.contactEmail.trim() || !form.contactPhone.trim()) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        apiWebhookUrl: form.apiWebhookUrl.trim() || undefined,
        platformFeePerClaim: Number(form.platformFeePerClaim) || 0,
        platformFeeMonthly: Number(form.platformFeeMonthly) || 0,
        active: form.active,
        mandatedForClients: form.mandatedForClients,
      };
      if (editing) {
        await insurersApi.update(editing.id, payload);
        setMessage('Seguradora actualizada.');
      } else {
        await insurersApi.create(payload);
        setMessage('Seguradora cadastrada com sucesso.');
      }
      setShowModal(false);
      setForm(emptyForm);
      await load();
    } catch {
      setMessage('Erro ao guardar seguradora.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Seguradoras — UriProva</h1>
          <p>Parceiros que recebem evidências certificadas de sinistro</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0D47A1', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Plus size={18} /> Cadastrar Seguradora
        </button>
      </div>

      {message ? (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 13 }}>
          {message}
        </div>
      ) : null}

      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Seguradoras activas', value: stats.activeInsurers, icon: Shield },
            { label: 'Sinistros este mês', value: stats.totalClaimsThisMonth, icon: Shield },
            { label: 'Receita estimada (mês)', value: formatCurrency(stats.estimatedRevenueThisMonth), icon: Shield },
          ].map((card) => (
            <div key={card.label} className={styles.statCard}>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>{card.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700 }}>{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ background: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: '#0D47A1' }}>
        <strong>Modelo de receita:</strong> cada seguradora paga uma taxa por sinistro reportado via UriProva
        (<code>platformFeePerClaim</code>) e opcionalmente uma licença mensal (<code>platformFeeMonthly</code>).
        Os clientes das seguradoras com <em>uso obrigatório</em> devem reportar sinistros apenas pela app UriGo.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar nome, código ou email…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
          />
        </div>
        {(['all', 'active', 'inactive'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: statusFilter === key ? '#0D47A1' : 'var(--white)',
              color: statusFilter === key ? 'white' : 'inherit',
              border: '1px solid var(--gray-100)',
            }}
          >
            {key === 'all' ? 'Todas' : key === 'active' ? 'Activas' : 'Inactivas'}
          </button>
        ))}
        <button type="button" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Seguradora</th>
              <th>Contacto</th>
              <th>Taxa/sinistro</th>
              <th>Licença/mês</th>
              <th>Sinistros</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>A carregar…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhuma seguradora encontrada</td></tr>
            ) : (
              filtered.map((insurer) => (
                <tr key={insurer.id}>
                  <td className={styles.orderId}>{insurer.code}</td>
                  <td>
                    {insurer.name}
                    {insurer.mandatedForClients ? (
                      <span style={{ marginLeft: 6, fontSize: 10, background: '#FFF3E8', color: '#F06400', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>OBRIGATÓRIO</span>
                    ) : null}
                  </td>
                  <td style={{ fontSize: 12 }}>{insurer.contactEmail}<br />{insurer.contactPhone}</td>
                  <td>{formatCurrency(insurer.platformFeePerClaim)}</td>
                  <td>{insurer.platformFeeMonthly ? formatCurrency(insurer.platformFeeMonthly) : '—'}</td>
                  <td>{insurer.claimsThisMonth}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={!insurer.active ? { background: '#FFF3E8', color: '#F06400' } : { background: '#E3F2FD', color: '#0D47A1' }}
                    >
                      {insurer.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => openEdit(insurer)} style={{ fontSize: 12, color: '#0D47A1', fontWeight: 600 }}>
                      Editar taxas
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>Sinistros recebidos (UriProva)</h2>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Referência</th>
              <th>Seguradora</th>
              <th>Apólice</th>
              <th>Tipo</th>
              <th>Evidências</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhum sinistro submetido ainda</td></tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id}>
                  <td className={styles.orderId}>{claim.reference}</td>
                  <td>{claim.insurerName}</td>
                  <td>{claim.policyNumber}</td>
                  <td>{claim.incidentType}</td>
                  <td>{claim.media.length} ficheiro(s)</td>
                  <td style={{ fontSize: 12 }}>{claim.submittedAt ? new Date(claim.submittedAt).toLocaleString('pt-AO') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} title={editing ? 'Editar Seguradora' : 'Cadastrar Seguradora'} onClose={() => setShowModal(false)}>
        <FormField label="Nome da seguradora">
          <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: ENSA" />
        </FormField>
        <FormField label="Código">
          <FormInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ENSA" />
        </FormField>
        <FormField label="Email de sinistros">
          <FormInput type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="sinistros@seguradora.ao" />
        </FormField>
        <FormField label="Telefone">
          <FormInput value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+244 222 XXX XXX" />
        </FormField>
        <FormField label="Webhook API (envio directo de evidências)">
          <FormInput value={form.apiWebhookUrl} onChange={(e) => setForm({ ...form, apiWebhookUrl: e.target.value })} placeholder="https://api.seguradora.ao/uriprova/webhook" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Taxa por sinistro (Kz)">
            <FormInput type="number" value={form.platformFeePerClaim} onChange={(e) => setForm({ ...form, platformFeePerClaim: e.target.value })} />
          </FormField>
          <FormField label="Licença mensal (Kz)">
            <FormInput type="number" value={form.platformFeeMonthly} onChange={(e) => setForm({ ...form, platformFeeMonthly: e.target.value })} />
          </FormField>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Seguradora activa
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
          <input type="checkbox" checked={form.mandatedForClients} onChange={(e) => setForm({ ...form, mandatedForClients: e.target.checked })} />
          Uso obrigatório para clientes da seguradora
        </label>
        <FormActions onCancel={() => setShowModal(false)} onSubmit={handleSave} submitLabel={editing ? 'Guardar' : 'Cadastrar'} loading={saving} />
      </Modal>
    </div>
  );
}
