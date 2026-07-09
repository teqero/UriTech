'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function PoolPage() {
  return (
    <WebShell title="UriGo Pool">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Partilhar Viagem</h1>
      <p style={{ color: 'var(--gray-500)' }}>Poupa até 40% ao partilhar com outros passageiros.</p>
      <Card title="Ana Silva" subtitle="Recolha: Luanda Sul · -25%" />
      <Card title="Carlos Neto" subtitle="Recolha: Talatona · -30%" />
      <PrimaryButton href="/tracking?service=pool">ENTRAR NO POOL</PrimaryButton>
    </WebShell>
  );
}
