'use client';

import { PortalShell } from '@/components/PortalShell';

export default function VendorPortalPage() {
  return (
    <PortalShell profileId="vendor">
      <h1>Painel Parceiro</h1>
      <p>Dashboard, produtos, stock, pedidos e relatórios adaptados ao seu negócio.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
        {['Novos 4', 'Preparando 2', 'Prontos 1', 'Vendas 154.200 Kz'].map((s) => (
          <div key={s} style={{ background: '#fff', padding: 16, borderRadius: 12, fontWeight: 700 }}>{s}</div>
        ))}
      </div>
    </PortalShell>
  );
}
