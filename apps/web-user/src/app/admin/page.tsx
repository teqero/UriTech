'use client';

import Link from 'next/link';
import { PortalShell } from '@/components/PortalShell';
import { getProfileConfig } from '@uritech/shared';

export default function AdminPortalPage() {
  const admin = getProfileConfig('admin');

  return (
    <PortalShell profileId="admin">
      <h1>Administração UriGo</h1>
      <p>Gestão de utilizadores, parceiros, relatórios e monitorização.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 24 }}>
        {admin.web.nav.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #eee',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 24, fontSize: 13, color: '#737373' }}>
        Módulos completos de backoffice também disponíveis em <code>/admin/orders</code>, etc. (web-admin integrado).
      </p>
    </PortalShell>
  );
}
