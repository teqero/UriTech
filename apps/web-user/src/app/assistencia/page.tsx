'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function AssistenciaPage() {
  return (
    <WebShell title="Assistência">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Reboque / Estrada</h1>
      <Card title="Reboque ligeiro" subtitle="desde 15.000 Kz" />
      <Card title="Bateria / Arranque" subtitle="desde 8.000 Kz" />
      <Card title="Pneu furado" subtitle="desde 5.000 Kz" />
      <PrimaryButton href="/tracking?service=assistencia">PEDIR ASSISTÊNCIA</PrimaryButton>
    </WebShell>
  );
}
