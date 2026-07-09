import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UriGo - Super App',
  description: 'Ride, Food, Mart, Send e muito mais',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
