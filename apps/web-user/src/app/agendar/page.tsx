'use client';

import { WebShell, PrimaryButton, Card } from '@/components/WebShell';

export default function AgendarPage() {
  return (
    <WebShell title="Agendar">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Agendar para Depois</h1>
      <p style={{ color: 'var(--gray-500)' }}>Reserve Taxi, Envio ou Serviços com antecedência.</p>
      <Card title="Taxi" subtitle="Agendar recolha" />
      <Card title="Envio" subtitle="Agendar entrega" />
      <Card title="Serviços" subtitle="Agendar profissional" />
      <PrimaryButton href="/tracking?service=agendar">CONFIRMAR AGENDAMENTO</PrimaryButton>
    </WebShell>
  );
}
