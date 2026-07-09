'use client';

import { WebShell, Card } from '@/components/WebShell';

export default function NegociosPage() {
  return (
    <WebShell title="Negócios">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Negócios Próximos</h1>
      <Card title="Kero Kilamba" subtitle="Supermercado · 0.8 km" onHref="/lojas" />
      <Card title="Farmácia Saúde+" subtitle="Farmácia · 1.2 km" onHref="/lojas" />
      <Card title="Restaurante Baía" subtitle="Comida · 1.5 km" onHref="/food" />
    </WebShell>
  );
}
