'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session || session.role !== 'admin') {
      router.replace('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center' }}>A carregar…</div>;
  }

  if (!session || session.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
