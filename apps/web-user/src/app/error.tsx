'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h2>Algo correu mal</h2>
      <button type="button" onClick={() => reset()} style={{ padding: '10px 20px', background: '#00AA13', color: 'white', borderRadius: 8 }}>
        Tentar novamente
      </button>
    </div>
  );
}
