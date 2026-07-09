'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, ShoppingBag, Store, DollarSign, MapPin } from 'lucide-react';
import { useAdminShell } from '@/components/AdminShellProvider';
import styles from './dashboard.module.css';

const stats = [
  { label: 'Motoristas Activos', value: '452', change: '↑ 12.5%', icon: Car, color: '#00AA13', href: '/drivers' },
  { label: 'Pedidos Hoje', value: '1,284', change: '↑ 3.2%', icon: ShoppingBag, color: '#1A73E8', href: '/orders' },
  { label: 'Comerciantes', value: '89', change: '↓ 1.5%', icon: Store, color: '#7B2D8E', href: '/vendors' },
  { label: 'Receita Hoje', value: '1.450.000 Kz', change: '↑ 8.4%', icon: DollarSign, color: '#F06400', href: '/financas' },
];

const transactions = [
  { user: 'Carlos Manuel', amount: '2.500 Kz', service: 'Taxi', status: 'PAGO' },
  { user: 'Maria Domingos', amount: '8.400 Kz', service: 'Lojas', status: 'PENDENTE' },
  { user: 'Pedro Kanza', amount: '1.200 Kz', service: 'Tuk-tuk', status: 'PAGO' },
  { user: 'Sofia Rosa', amount: '4.200 Kz', service: 'Farmácia', status: 'CANCELADO' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useAdminShell();

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Painel Operacional - Luanda</h1>
          <p>Gestor Operações • Luanda HQ</p>
        </div>
        <button
          type="button"
          className={styles.liveBadge}
          onClick={() => showToast('Dados actualizados em tempo real.')}
        >
          TEMPO REAL
        </button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              type="button"
              className={styles.statCard}
              style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid var(--gray-100)' }}
              onClick={() => router.push(stat.href)}
            >
              <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statChange}>{stat.change}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Tendência de Pedidos (24h)</h2>
            <span className={styles.totalBadge}>1.2k TOTAL</span>
          </div>
          <div className={styles.chartBars}>
            {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
              <div key={i} className={styles.bar} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Volume por Serviço</h2>
          </div>
          <div className={styles.serviceVolume}>
            <div className={styles.volumeItem}>
              <span>Taxi</span>
              <div className={styles.volumeBar}><div style={{ width: '58%', background: '#00AA13' }} /></div>
              <span>58%</span>
            </div>
            <div className={styles.volumeItem}>
              <span>Entrega</span>
              <div className={styles.volumeBar}><div style={{ width: '32%', background: '#1A73E8' }} /></div>
              <span>32%</span>
            </div>
            <div className={styles.volumeItem}>
              <span>Outros</span>
              <div className={styles.volumeBar}><div style={{ width: '10%', background: '#F06400' }} /></div>
              <span>10%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><MapPin size={18} /> Mapa de Pedidos Activos</h2>
            <button type="button" className={styles.liveBadge} onClick={() => router.push('/orders')}>LIVE</button>
          </div>
          <button
            type="button"
            className={styles.mapPlaceholder}
            style={{ width: '100%', cursor: 'pointer' }}
            onClick={() => router.push('/orders')}
          >
            🗺️ Mapa em tempo real - Luanda — clique para ver pedidos
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Últimas Transações</h2>
            <Link href="/orders">Ver Todas</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Utilizador</th><th>Valor</th><th>Serviço</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.user} style={{ cursor: 'pointer' }} onClick={() => router.push('/orders')}>
                  <td>{tx.user}</td>
                  <td>{tx.amount}</td>
                  <td><span className={styles.serviceBadge}>{tx.service}</span></td>
                  <td><span className={styles.statusBadge}>{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
