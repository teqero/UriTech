'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function AutomovelPage() {
  return (
    <WebShell title="Automóvel">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Cuidado Auto</h1>
      <Card title="Lavagem completa" subtitle="desde 3.500 Kz" />
      <Card title="Mudança de óleo" subtitle="desde 12.000 Kz" />
      <Card title="Inspecção" subtitle="desde 8.000 Kz" />
      <PrimaryButton href="/tracking?service=automovel">SOLICITAR SERVIÇO</PrimaryButton>
    </WebShell>
  );
}
