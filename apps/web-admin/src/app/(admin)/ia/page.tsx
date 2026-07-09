'use client';

import { useRouter } from 'next/navigation';
import { useAdminShell } from '@/components/AdminShellProvider';
import styles from '../dashboard.module.css';

const alerts = [
  { user: 'User #1294', issue: 'Múltiplas contas detectadas', level: 'Urgente (2)', severity: 'ALTO', href: '/users' },
  { user: 'Driver #004', issue: 'Anomalia de GPS detectada', level: 'ALTO', severity: 'ALTO', href: '/drivers' },
  { user: 'Store #09', issue: 'Transações em duplicado', level: 'MÉDIO', severity: 'MÉDIO', href: '/vendors' },
];

export default function IAPage() {
  const router = useRouter();
  const { showToast, addNotification } = useAdminShell();

  function applySurge() {
    showToast('Multiplicador 1.2x activado no Kilamba.');
    addNotification({
      title: 'Surge pricing activo',
      message: 'Multiplicador 1.2x aplicado na zona Kilamba.',
      href: '/ia',
      type: 'ia',
    });
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>IA e Monitoramento Inteligente</h1>
          <p>Gestor Operações • Luanda HQ</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { label: 'Preços Dinâmicos', value: 'ACTIVO', sub: 'IA Otimizada' },
          { label: 'Anti-Fraude', value: '0 Ameaças', sub: '' },
          { label: 'Suporte IA', value: '92% AUTOM.', sub: '+12% Eficiência' },
          { label: 'Promo Auto', value: 'URI24 Código', sub: '12 ACTIVAS' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.statCard}
            style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid var(--gray-100)' }}
            onClick={() => showToast(`${item.label}: ${item.value}`)}
          >
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>{item.label}</span>
              <span className={styles.statValue}>{item.value}</span>
              {item.sub && <span className={styles.statChange}>{item.sub}</span>}
            </div>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Métricas da Plataforma em Tempo Real</h2>
          <div className={styles.mapPlaceholder} style={{ height: 200 }}>
            Visualização de Grafos Neuronais (Simulada)
          </div>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Alertas de Fraude</h2>
          {alerts.map((a) => (
            <button
              key={a.user}
              type="button"
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--gray-100)', background: 'none' }}
              onClick={() => router.push(a.href)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{a.user}</strong>
                <span className={styles.statusBadge} style={{ background: a.severity === 'ALTO' ? '#FFF0F0' : '#FFF3E8', color: a.severity === 'ALTO' ? '#EE2737' : '#F06400' }}>
                  {a.severity}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{a.issue}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 24, background: 'var(--primary-light)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Recomendações da IA</h3>
        <p style={{ fontSize: 14, marginBottom: 16 }}>
          &quot;Detectamos alta procura no Kilamba. Sugerimos ativar multiplicador de 1.2x para incentivar motoristas.&quot;
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" style={{ background: 'var(--primary)', color: 'white', padding: '8px 20px', borderRadius: 8, fontWeight: 600 }} onClick={applySurge}>APLICAR</button>
          <button type="button" style={{ border: '1px solid var(--gray-300)', padding: '8px 20px', borderRadius: 8, fontWeight: 600 }} onClick={() => showToast('Recomendação ignorada.')}>IGNORAR</button>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 16 }}>
        <p><strong>WhatsApp Integration</strong> — Bot de Suporte: <span style={{ color: 'var(--primary)' }}>ONLINE</span></p>
      </div>
    </div>
  );
}
