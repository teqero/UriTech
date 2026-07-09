'use client';

import { PortalShell } from '@/components/PortalShell';

export default function DeliveryPortalPage() {
  return (
    <PortalShell profileId="delivery_rider">
      <h1>Painel Entregador</h1>
      <p>Entregas activas, rotas optimizadas e disponibilidade.</p>
      <p>2 entregas em curso • 8.650 Kz hoje</p>
    </PortalShell>
  );
}
