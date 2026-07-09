'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import styles from '../home.module.css';

const menuItems = [
  { id: '1', name: 'Nasi Goreng Spesial', desc: 'Nasi goreng com ovo, frango e legumes', price: 25.0, image: '🍛' },
  { id: '2', name: 'Es Teh Manis', desc: 'Chá gelado tradicional', price: 8.0, image: '🧋' },
  { id: '3', name: 'Ayam Bakar', desc: 'Frango grelhado com arroz', price: 32.0, image: '🍗' },
  { id: '4', name: 'Gado-Gado', desc: 'Salada indonésia com molho de amendoim', price: 22.0, image: '🥗' },
];

export default function FoodPage() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <a href="/" style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>← Voltar</a>
          <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>Food</span>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍛</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Warung Nasi Goreng</h2>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--black)', fontWeight: 600 }}>
                <Star size={12} fill="#F5A623" color="#F5A623" /> 4.8
              </span>
              <span>15-25 min</span>
              <span>Indonesian</span>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Cardápio</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {menuItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: 14, padding: 12, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>{item.image}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{item.name}</h4>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{item.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>R$ {item.price.toFixed(2)}</span>
                  <button style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/tracking?service=lojas&dest=Supermercado%20Kilamba&ref=URI-98443"
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
          FINALIZAR PEDIDO
        </Link>
      </main>
    </div>
  );
}
