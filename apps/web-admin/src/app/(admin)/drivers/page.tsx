'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { formatCurrency } from '@uritech/shared';
import { driversApi, type AdminDriver } from '@/lib/api';
import { Modal, FormField, FormInput, FormSelect, FormActions } from '@/components/Modal';
import styles from '../dashboard.module.css';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  vehicleType: 'motorcycle' as 'motorcycle' | 'car',
  vehiclePlate: '',
  isOnline: false,
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDrivers(await driversApi.list());
    } catch {
      setMessage('Erro ao carregar motoristas. Inicie o backend na porta 4000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.vehiclePlate.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && d.isOnline) ||
        (statusFilter === 'offline' && !d.isOnline);
      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.vehiclePlate.trim()) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await driversApi.create(form);
      setShowModal(false);
      setForm(emptyForm);
      setMessage('Motorista adicionado com sucesso.');
      await load();
    } catch {
      setMessage('Erro ao adicionar motorista.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Motoristas</h1>
          <p>Gerenciar motoristas parceiros</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Plus size={18} /> Adicionar Motorista
        </button>
      </div>

      {message ? (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 13 }}>
          {message}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar por nome, telefone ou matrícula…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
          />
        </div>
        {(['all', 'online', 'offline'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: statusFilter === key ? 'var(--primary)' : 'var(--white)',
              color: statusFilter === key ? 'white' : 'inherit',
              border: '1px solid var(--gray-100)',
            }}
          >
            {key === 'all' ? 'Todos' : key === 'online' ? 'Online' : 'Offline'}
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
              <th>ID</th>
              <th>Nome</th>
              <th>Veículo</th>
              <th>Avaliação</th>
              <th>Corridas</th>
              <th>Ganhos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>A carregar…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhum motorista encontrado</td></tr>
            ) : (
              filtered.map((driver) => (
                <tr key={driver.id}>
                  <td className={styles.orderId}>#{driver.id}</td>
                  <td>{driver.name}</td>
                  <td>{driver.vehicleType === 'motorcycle' ? 'Moto' : 'Carro'} — {driver.vehiclePlate}</td>
                  <td>⭐ {driver.rating.toFixed(1)}</td>
                  <td>{driver.totalRides}</td>
                  <td>{formatCurrency(driver.totalEarnings)}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={!driver.isOnline ? { background: '#F7F7F7', color: '#737373' } : undefined}
                    >
                      {driver.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} title="Adicionar Motorista" onClose={() => setShowModal(false)}>
        <FormField label="Nome completo">
          <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Carlos Manuel" />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="motorista@email.com" />
        </FormField>
        <FormField label="Telefone">
          <FormInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 9XX XXX XXX" />
        </FormField>
        <FormField label="Tipo de veículo">
          <FormSelect value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value as 'motorcycle' | 'car' })}>
            <option value="motorcycle">Moto</option>
            <option value="car">Carro</option>
          </FormSelect>
        </FormField>
        <FormField label="Matrícula">
          <FormInput value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="LD-00-00-AB" />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
          <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} />
          Iniciar como Online
        </label>
        <FormActions onCancel={() => setShowModal(false)} onSubmit={handleCreate} submitLabel="Adicionar" loading={saving} />
      </Modal>
    </div>
  );
}
