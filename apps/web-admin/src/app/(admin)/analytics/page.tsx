import styles from '../dashboard.module.css';

export default function AnalyticsPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Analytics</h1>
          <p>Métricas e relatórios da plataforma</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>GMV Mensal</span>
            <span className={styles.statValue}>R$ 2.4M</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Taxa de Conversão</span>
            <span className={styles.statValue}>68.5%</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Tempo Médio Entrega</span>
            <span className={styles.statValue}>28 min</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>NPS Score</span>
            <span className={styles.statValue}>72</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Pedidos por Serviço</h2>
        </div>
        <div className={styles.chartBars} style={{ height: 200 }}>
          {[
            { label: 'Food', h: 90 },
            { label: 'Ride', h: 75 },
            { label: 'Mart', h: 55 },
            { label: 'Send', h: 40 },
            { label: 'Pay', h: 65 },
            { label: 'Pulsa', h: 30 },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className={styles.bar} style={{ height: `${item.h}%`, width: '100%' }} />
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
