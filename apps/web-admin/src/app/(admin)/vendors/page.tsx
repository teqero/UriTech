'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { vendorsApi, type AdminVendor } from '@/lib/api';
import { Modal, FormField, FormInput, FormActions } from '@/components/Modal';
import styles from '../dashboard.module.css';

const emptyForm = {
  storeName: '',
  email: '',
  phone: '',
  storeAddress: '',
  categories: '',
  isOpen: true,
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVendors(await vendorsApi.list());
    } catch {
      setMessage('Erro ao carregar comerciantes. Inicie o backend na porta 4000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesSearch =
        !q ||
        v.storeName.toLowerCase().includes(q) ||
        v.storeAddress.toLowerCase().includes(q) ||
        v.categories.some((c) => c.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && v.isOpen) ||
        (statusFilter === 'closed' && !v.isOpen);
      return matchesSearch && matchesStatus;
    });
  }, [vendors, search, statusFilter]);

  const handleCreate = async () => {
    if (!form.storeName.trim() || !form.email.trim() || !form.phone.trim() || !form.storeAddress.trim()) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await vendorsApi.create({
        storeName: form.storeName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        storeAddress: form.storeAddress.trim(),
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
        isOpen: form.isOpen,
      });
      setShowModal(false);
      setForm(emptyForm);
      setMessage('Comerciante adicionado com sucesso.');
      await load();
    } catch {
      setMessage('Erro ao adicionar comerciante.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Comerciantes</h1>
          <p>Gerenciar restaurantes e lojas parceiras</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Plus size={18} /> Adicionar Comerciante
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
            placeholder="Procurar loja, endereço ou categoria…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
          />
        </div>
        {(['all', 'open', 'closed'] as const).map((key) => (
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
            {key === 'all' ? 'Todos' : key === 'open' ? 'Abertos' : 'Fechados'}
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
              <th>Loja</th>
              <th>Endereço</th>
              <th>Categoria</th>
              <th>Avaliação</th>
              <th>Pedidos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>A carregar…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhum comerciante encontrado</td></tr>
            ) : (
              filtered.map((vendor) => (
                <tr key={vendor.id}>
                  <td className={styles.orderId}>#{vendor.id}</td>
                  <td>{vendor.storeName}</td>
                  <td>{vendor.storeAddress}</td>
                  <td><span className={styles.serviceBadge}>{vendor.categories.join(', ') || '—'}</span></td>
                  <td>⭐ {vendor.rating.toFixed(1)}</td>
                  <td>{vendor.totalOrders}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={!vendor.isOpen ? { background: '#FFF3E8', color: '#F06400' } : undefined}
                    >
                      {vendor.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} title="Adicionar Comerciante" onClose={() => setShowModal(false)}>
        <FormField label="Nome da loja">
          <FormInput value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="Ex: Restaurante Kilamba" />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="loja@email.com" />
        </FormField>
        <FormField label="Telefone">
          <FormInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 9XX XXX XXX" />
        </FormField>
        <FormField label="Endereço">
          <FormInput value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} placeholder="Rua, bairro, cidade" />
        </FormField>
        <FormField label="Categorias (separadas por vírgula)">
          <FormInput value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="Comida, Fast Food" />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14 }}>
          <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
          Loja aberta
        </label>
        <FormActions onCancel={() => setShowModal(false)} onSubmit={handleCreate} submitLabel="Adicionar" loading={saving} />
      </Modal>
    </div>
  );
}
