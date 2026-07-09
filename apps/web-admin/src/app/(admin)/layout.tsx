'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  Store,
  ShoppingBag,
  BarChart3,
  Settings,
  Sparkles,
  Plug,
  Shield,
} from 'lucide-react';
import { BrandProvider } from '@/components/BrandProvider';
import { AdminShellProvider } from '@/components/AdminShellProvider';
import { AdminHeader, AdminLogoutButton } from '@/components/AdminHeader';
import { AdminAuthGate } from '@/components/AdminAuthGate';
import styles from './admin.module.css';

const navItems = [
  { href: '/', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/drivers', label: 'Motoristas', icon: Car },
  { href: '/vendors', label: 'Comerciantes', icon: Store },
  { href: '/seguradoras', label: 'Seguradoras', icon: Shield },
  { href: '/users', label: 'Utilizadores', icon: Users },
  { href: '/financas', label: 'Finanças', icon: BarChart3 },
  { href: '/servicos', label: 'Serviços', icon: Settings },
  { href: '/ia', label: 'IA', icon: Sparkles },
  { href: '/settings/integracoes', label: 'Integrações', icon: Plug },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminAuthGate>
      <BrandProvider>
        <AdminShellProvider>
          <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>U</span>
              <span className={styles.logoText}>UriGo</span>
              <span className={styles.logoBadge}>Admin</span>
            </Link>

            <nav className={styles.nav}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/settings'
                    ? pathname === '/settings'
                    : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <AdminLogoutButton />
          </aside>

          <div className={styles.main}>
            <AdminHeader />
            <main className={styles.content}>{children}</main>
          </div>
        </div>
      </AdminShellProvider>
    </BrandProvider>
    </AdminAuthGate>
  );
}
