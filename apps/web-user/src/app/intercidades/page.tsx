'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function IntercidadesPage() {
  return (
    <WebShell title="Intercidades">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Viagem Intercidades</h1>
      <Card title="Origem" subtitle="Luanda" />
      <Card title="Destino" subtitle="Benguela" />
      <Card title="Data" subtitle="24 Out, 2024" />
      <PrimaryButton href="/tracking?service=intercidades">PESQUISAR VIAGENS</PrimaryButton>
    </WebShell>
  );
}
