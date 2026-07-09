'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function FamiliaPage() {
  return (
    <WebShell title="Família">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Rastrear Família</h1>
      <Card title="Maria Silva" subtitle="Em movimento · Talatona" />
      <Card title="Pedro Silva" subtitle="Em casa · Kilamba" />
      <PrimaryButton href="/tracking?service=familia">VER NO MAPA</PrimaryButton>
    </WebShell>
  );
}
