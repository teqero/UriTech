'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Palette, Plug, Settings2 } from 'lucide-react';
import { useAdminShell } from '@/components/AdminShellProvider';
import styles from '../dashboard.module.css';

const sections = [
  {
    href: '/settings/marca',
    icon: Palette,
    title: 'White-Label / Identidade Visual',
    description: 'Nome, cores, logo, fonte e identidade da marca em todas as apps',
  },
  {
    href: '/settings/integracoes',
    icon: Plug,
    title: 'Integrações de API',
    description: 'Gateways de pagamento (Multicaixa, PayPal, etc.), mapas, SMS, email e push',
  },
];

export default function SettingsPage() {
  const { showToast } = useAdminShell();
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [commission, setCommission] = useState('15');
  const [escrow, setEscrow] = useState('1.5');

  function handleSave() {
    showToast(`Configurações guardadas: taxa ${deliveryFee} Kz, comissão ${commission}%, escrow ${escrow}%.`);
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Configurações</h1>
          <p>Gestão da plataforma, identidade visual e integrações</p>
        </div>
      </div>

      <div className={styles.grid}>
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className={styles.card} style={{ display: 'block', transition: 'box-shadow 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Icon size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{title}</h2>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.5 }}>{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.card} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Settings2 size={20} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Configurações Gerais</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Taxa de Entrega Padrão (Kz)</label>
            <input type="text" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Comissão Plataforma (%)</label>
            <input type="text" value={commission} onChange={(e) => setCommission(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Taxa Escrow (%)</label>
            <input type="text" value={escrow} onChange={(e) => setEscrow(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }} />
          </div>
          <button type="button" onClick={handleSave} style={{ alignSelf: 'flex-start', marginTop: 8, background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: 10, fontWeight: 600 }}>
            SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
}
