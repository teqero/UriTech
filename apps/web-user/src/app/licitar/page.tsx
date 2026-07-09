'use client';

import { useState } from 'react';
import { WebShell, PrimaryButton } from '@/components/WebShell';

export default function LicitarPage() {
  const [offer, setOffer] = useState('1500');
  return (
    <WebShell title="Licitar">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Licitar Serviço / Taxi</h1>
      <p style={{ color: 'var(--gray-500)' }}>Defina a sua oferta e aguarde propostas de profissionais.</p>
      <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Sua oferta (Kz)</label>
      <input
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid var(--gray-100)', marginTop: 8 }}
      />
      <PrimaryButton href="/tracking?service=licitar">ENVIAR OFERTA</PrimaryButton>
    </WebShell>
  );
}
