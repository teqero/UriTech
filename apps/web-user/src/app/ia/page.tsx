'use client';

import { WebShell, Card } from '@/components/WebShell';

export default function IaPage() {
  return (
    <WebShell title="IA UriGo">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>IA UriGo</h1>
      <p style={{ color: 'var(--gray-500)' }}>Assistente inteligente para rotas, preços e suporte.</p>
      <Card title="Sugestão de rota" subtitle="Evite trânsito na Via Expressa" />
      <Card title="Preço dinâmico" subtitle="Taxi 12% mais barato em 15 min" />
      <Card title="Suporte 24h" subtitle="Chat com IA + humano" />
    </WebShell>
  );
}
