'use client';

import Link from 'next/link';
import * as React from 'react';
import styles from '../app/landing.module.css';

export function WebShell({
  title,
  children,
  backHref = '/',
}: {
  title: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>U</span>
          <span className={styles.logoText}>UriGo</span>
        </Link>
        <span style={{ fontWeight: 700 }}>{title}</span>
        <Link href={backHref} style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
          ← Voltar
        </Link>
      </header>
      <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 24px 64px' }}>{children}</div>
    </div>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        background: 'var(--primary)',
        color: 'white',
        padding: 16,
        borderRadius: 12,
        textAlign: 'center',
        fontWeight: 700,
        marginTop: 24,
      }}
    >
      {children}
    </Link>
  );
}

export function Card({
  title,
  subtitle,
  onHref,
}: {
  title: string;
  subtitle?: string;
  onHref?: string;
}) {
  const inner = (
    <div
      style={{
        display: 'block',
        padding: 16,
        border: '1px solid var(--gray-100)',
        borderRadius: 12,
        marginBottom: 12,
        background: 'white',
      }}
    >
      <p style={{ fontWeight: 700, margin: 0 }}>{title}</p>
      {subtitle ? <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '6px 0 0' }}>{subtitle}</p> : null}
    </div>
  );
  return onHref ? <Link href={onHref} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link> : inner;
}
