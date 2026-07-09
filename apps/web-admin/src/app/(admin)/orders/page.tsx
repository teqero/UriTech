'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import styles from '../dashboard.module.css';

const orders = [
  { id: 'ORD-001', user: 'João Silva', vendor: 'Warung Nasi', service: 'Food', total: '6.600 Kz', status: 'Em trânsito', date: '04/07/2026' },
  { id: 'ORD-002', user: 'Maria Santos', vendor: 'Burger King', service: 'Food', total: '14.250 Kz', status: 'Entregue', date: '04/07/2026' },
  { id: 'ORD-003', user: 'Pedro Costa', vendor: '-', service: 'Ride', total: '3.500 Kz', status: 'Concluído', date: '03/07/2026' },
  { id: 'ORD-004', user: 'Ana Lima', vendor: 'KFC', service: 'Food', total: '8.990 Kz', status: 'Preparando', date: '03/07/2026' },
];

const STATUS_FILTERS = ['Todos', 'Em trânsito', 'Entregue', 'Preparando', 'Concluído'] as const;

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('Todos');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.user.toLowerCase().includes(q) ||
        o.vendor.toLowerCase().includes(q) ||
        o.service.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Pedidos</h1>
          <p>Acompanhar todos os pedidos da plataforma</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar pedido, utilizador ou loja…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
          />
        </div>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: statusFilter === status ? 'var(--primary)' : 'var(--white)',
              color: statusFilter === status ? 'white' : 'inherit',
              border: '1px solid var(--gray-100)',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuário</th>
              <th>Vendedor</th>
              <th>Serviço</th>
              <th>Total</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nenhum pedido encontrado</td></tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderId}>{order.id}</td>
                  <td>{order.user}</td>
                  <td>{order.vendor}</td>
                  <td><span className={styles.serviceBadge}>{order.service}</span></td>
                  <td>{order.total}</td>
                  <td><span className={styles.statusBadge}>{order.status}</span></td>
                  <td>{order.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
