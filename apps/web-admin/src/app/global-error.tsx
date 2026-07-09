'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <h2>Erro inesperado</h2>
          <button type="button" onClick={() => reset()} style={{ padding: '10px 20px', background: '#00AA13', color: 'white', borderRadius: 8 }}>
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
