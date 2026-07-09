'use client';

import { PortalShell } from '@/components/PortalShell';

export default function DriverPortalPage() {
  return (
    <PortalShell profileId="driver">
      <h1>Painel Motorista</h1>
      <p>Estado online, corridas, ganhos e histórico — apenas funcionalidades de motorista.</p>
      <ul>
        <li>🟢 Online — 8 viagens hoje</li>
        <li>💰 Ganhos: 12.450 Kz</li>
        <li>⭐ Avaliação 4.9</li>
      </ul>
    </PortalShell>
  );
}
