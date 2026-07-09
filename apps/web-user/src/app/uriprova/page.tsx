'use client';

import { DEMO_INSURERS, URIPROVA_VALUE_PROPS, formatCurrency } from '@uritech/shared';
import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function UriProvaPage() {
  return (
    <WebShell title="UriProva">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Evidências de Sinistro</h1>
      <p style={{ color: 'var(--gray-500)' }}>Fotos, vídeo, áudio e GPS para a seguradora.</p>
      {URIPROVA_VALUE_PROPS.map((p) => (
        <p key={p} style={{ margin: '8px 0' }}>✓ {p}</p>
      ))}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24 }}>Seguradoras parceiras</h2>
      {DEMO_INSURERS.filter((i) => i.active).map((ins) => (
        <Card
          key={ins.id}
          title={ins.name}
          subtitle={`Taxa plataforma: ${formatCurrency(ins.platformFeePerClaim)}/sinistro`}
        />
      ))}
      <PrimaryButton href="/login">ABRIR APP MÓVEL PARA CAPTURAR</PrimaryButton>
    </WebShell>
  );
}
