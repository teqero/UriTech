import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UriTech Admin',
  description: 'Painel administrativo UriTech Super App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
