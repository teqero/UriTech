'use client';

import { useState } from 'react';
import { DEMO_ACCOUNTS } from '@uritech/shared';
import { useAuth } from '@/components/AuthProvider';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@uritech.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>UriGo Admin</h1>
        <p className={styles.sub}>Painel administrativo</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Palavra-passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" disabled={loading}>{loading ? 'A entrar…' : 'Entrar'}</button>
        </form>
        <div className={styles.demos}>
          <p>Demo: admin@uritech.com / demo123</p>
          {DEMO_ACCOUNTS.filter((a) => a.email === 'admin@uritech.com').map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={styles.demoBtn}
              onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
