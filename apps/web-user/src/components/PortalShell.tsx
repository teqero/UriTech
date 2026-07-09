'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getProfileConfig, type AppProfileId } from '@uritech/shared';
import { useAuth, useProfileTheme } from '@/components/AuthProvider';
import styles from './portal-shell.module.css';

export function PortalShell({
  profileId,
  children,
}: {
  profileId: AppProfileId;
  children: React.ReactNode;
}) {
  const { session, logout, loading } = useAuth();
  const theme = useProfileTheme();
  const pathname = usePathname();
  const router = useRouter();
  const config = getProfileConfig(profileId);

  if (loading) return <div className={styles.loading}>A carregar…</div>;

  if (!session || session.role !== profileId) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  return (
    <div className={styles.layout} style={{ ['--portal-primary' as string]: theme.primary }}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>U</span>
          <div>
            <strong>UriGo</strong>
            <small>{config.label}</small>
          </div>
        </div>
        <nav>
          {config.web.nav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={pathname === item.href ? styles.navActive : styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button type="button" className={styles.logout} onClick={logout}>
          Sair ({session.user.name})
        </button>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
