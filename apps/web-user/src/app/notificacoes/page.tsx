'use client';

import { WebShell, Card } from '@/components/WebShell';

const ITEMS = [
  { title: 'Motorista a caminho', subtitle: 'João Pedro chega em 4 min' },
  { title: 'SecurePay confirmado', subtitle: 'Código 847293 gerado' },
  { title: 'Promoção UriGo', subtitle: '20% em envios hoje' },
];

export default function NotificacoesPage() {
  return (
    <WebShell title="Notificações">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Notificações</h1>
      {ITEMS.map((i) => (
        <Card key={i.title} title={i.title} subtitle={i.subtitle} />
      ))}
    </WebShell>
  );
}
