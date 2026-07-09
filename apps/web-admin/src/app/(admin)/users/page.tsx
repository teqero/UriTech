'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import type { UserRole } from '@uritech/shared';
import { usersApi, type AdminUser } from '@/lib/api';
import { Modal, FormField, FormInput, FormSelect, FormActions } from '@/components/Modal';
import styles from '../dashboard.module.css';

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilizador',
  driver: 'Motorista',
  vendor: 'Comerciante',
  admin: 'Admin',
  delivery_rider: 'Entregador',
  service_provider: 'Prestador',
  corporate: 'Corporativo',
  restaurant: 'Restaurante',
  pharmacy: 'Farmácia',
  supermarket: 'Supermercado',
  store: 'Loja',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'user' as UserRole,
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.list({
        search: search.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      });
      setUsers(data);
    } catch {
      setMessage('Erro ao carregar utilizadores. Inicie o backend na porta 4000.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await usersApi.create(form);
      setShowModal(false);
      setForm(emptyForm);
      setMessage('Utilizador criado com sucesso.');
      await load();
    } catch {
      setMessage('Erro ao criar utilizador (email pode já existir).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Utilizadores</h1>
          <p>Gerenciar todos os utilizadores da plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={18} /> Novo Utilizador
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
            placeholder="Procurar por nome, email ou telefone…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
          />
        </div>
        {(['all', 'user', 'driver', 'vendor', 'admin'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRoleFilter(key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: roleFilter === key ? 'var(--primary)' : 'var(--white)',
              color: roleFilter === key ? 'white' : 'inherit',
              border: '1px solid var(--gray-100)',
            }}
          >
            {key === 'all' ? 'Todos' : ROLE_LABELS[key]}
          </button>
        ))}
        <button type="button" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', marginLeft: 'auto' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className={styles.card}>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
          {loading ? 'A carregar…' : `${users.length} utilizador(es) encontrado(s)`}
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Tipo</th>
              <th>Registo</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhum utilizador encontrado</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className={styles.orderId}>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td><span className={styles.serviceBadge}>{ROLE_LABELS[user.role]}</span></td>
                  <td>{new Date(user.createdAt).toLocaleDateString('pt-AO')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} title="Novo Utilizador" onClose={() => setShowModal(false)}>
        <FormField label="Nome completo">
          <FormInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Ana Costa" />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="utilizador@email.com" />
        </FormField>
        <FormField label="Telefone">
          <FormInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 9XX XXX XXX" />
        </FormField>
        <FormField label="Tipo de conta">
          <FormSelect value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormActions onCancel={() => setShowModal(false)} onSubmit={handleCreate} submitLabel="Criar" loading={saving} />
      </Modal>
    </div>
  );
}
