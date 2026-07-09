import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700 }}>404</h1>
      <p>Página não encontrada</p>
      <Link href="/" style={{ color: 'var(--primary, #00AA13)', fontWeight: 600 }}>Voltar ao início</Link>
    </div>
  );
}
