'use client';

import { MapEmbed } from '@/components/MapEmbed';
import { DEFAULT_ORIGIN, formatPlaceLabel, previewDemoPlace } from '@uritech/shared';
import styles from '../home.module.css';

export default function RidePage() {
  const dest = previewDemoPlace('Marginal de Luanda');
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <a href="/" style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>← Voltar</a>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>Ride</span>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <main className={styles.main}>
        <MapEmbed origin={DEFAULT_ORIGIN} destination={dest} height={200} showUserLocation />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
            <div>
              <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Origem</span>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{formatPlaceLabel(DEFAULT_ORIGIN)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--error)' }} />
            <div>
              <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Destino</span>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{dest ? formatPlaceLabel(dest) : 'Marginal de Luanda'}</p>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Escolha o veículo</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { type: 'Moto', icon: '🏍️', price: 'R$ 25,00', time: '5 min', desc: 'Rápido e econômico' },
            { type: 'Carro', icon: '🚗', price: 'R$ 45,00', time: '8 min', desc: 'Confortável para até 4 pessoas' },
          ].map((vehicle) => (
            <div key={vehicle.type} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '2px solid var(--primary)', borderRadius: 12, background: 'var(--primary-light)' }}>
              <span style={{ fontSize: 32 }}>{vehicle.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{vehicle.type}</p>
                <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{vehicle.desc}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{vehicle.price}</p>
                <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>{vehicle.time}</p>
              </div>
            </div>
          ))}
        </div>

        <button style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: 16, borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
          Pedir Ride
        </button>
      </main>
    </div>
  );
}
