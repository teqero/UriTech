'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { useAdminShell } from '@/components/AdminShellProvider';
import styles from '../dashboard.module.css';

export default function FinancasPage() {
  const { showToast, addNotification } = useAdminShell();
  const [paymentCount, setPaymentCount] = useState(0);
  const [pending, setPending] = useState(['#1025', '#1026', '#1027']);

  useEffect(() => {
    settingsApi.getIntegrations('payment').then((list) => {
      setPaymentCount(list.filter((i) => i.enabled).length);
    }).catch(() => {});
  }, []);

  const gateways = [
    { name: 'Multicaixa Express', volume: '4.2M Kz', status: 'ACTIVO' },
    { name: 'Unitel Money', volume: '1.1M Kz', status: 'ACTIVO' },
    { name: 'BAI Direto', volume: '640k Kz', status: 'INSTÁVEL' },
    { name: 'Pagasam', volume: '850k Kz', status: 'ACTIVO' },
    { name: 'PayPal', volume: '120k Kz', status: 'ACTIVO' },
  ];

  const settlements = [
    { id: 'SET-881', type: 'Commission', amount: '45.200 Kz', method: 'Express', status: 'CONCLUÍDO', date: 'Hoje' },
    { id: 'SET-880', type: 'Withdrawal', amount: '120.000 Kz', method: 'BAI', status: 'AGUARDANDO', date: 'Ontem' },
    { id: 'SET-879', type: 'Refund', amount: '2.500 Kz', method: 'Wallet', status: 'CONCLUÍDO', date: 'Ontem' },
  ];

  function processAll() {
    setPending([]);
    showToast('3 levantamentos processados com sucesso.');
    addNotification({
      title: 'Levantamentos processados',
      message: '45.000 Kz transferidos para 3 motoristas.',
      href: '/financas',
      type: 'payment',
    });
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Finanças e Pagamentos</h1>
          <p>Gestor Operações • Luanda HQ • {paymentCount} gateway(s) activo(s)</p>
        </div>
        <Link href="/settings/integracoes" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
          <ExternalLink size={16} /> Configurar APIs
        </Link>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Gateways de Pagamento</h2>
      <div className={styles.statsGrid}>
        {gateways.map((gw) => (
          <button
            key={gw.name}
            type="button"
            className={styles.statCard}
            style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid var(--gray-100)' }}
            onClick={() => showToast(`${gw.name}: ${gw.volume} processados hoje.`)}
          >
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{gw.name}</span>
              <span className={styles.statValue}>{gw.volume}</span>
              <span className={styles.statusBadge} style={gw.status === 'INSTÁVEL' ? { background: '#FFF3E8', color: '#F06400' } : undefined}>
                {gw.status}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.grid} style={{ marginTop: 32 }}>
        <div className={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Receita Diária (7 Dias)</h2>
          <div className={styles.chartBars} style={{ height: 160 }}>
            {['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].map((d, i) => (
              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className={styles.bar} style={{ height: `${[60, 75, 55, 90, 70, 85, 95][i]}%`, width: '100%' }} />
                <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Levantamentos Pendentes</h2>
            <button
              type="button"
              disabled={pending.length === 0}
              style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: pending.length ? 1 : 0.5 }}
              onClick={processAll}
            >
              PROCESSAR TODOS
            </button>
          </div>
          {pending.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Nenhum levantamento pendente.</p>
          ) : (
            pending.map((id) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span>Motorista {id}</span>
                <span style={{ fontWeight: 700 }}>15.000 Kz</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Assentamentos de Motoristas</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Tipo</th><th>Valor Kz</th><th>Método</th><th>Estado</th><th>Data</th></tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id}>
                <td className={styles.orderId}>{s.id}</td>
                <td>{s.type}</td>
                <td>{s.amount}</td>
                <td>{s.method}</td>
                <td><span className={styles.statusBadge}>{s.status}</span></td>
                <td>{s.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
