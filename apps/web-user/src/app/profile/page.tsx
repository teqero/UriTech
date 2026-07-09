'use client';

import Link from 'next/link';
import { DEFAULT_WHITE_LABEL, getCopyrightText } from '@uritech/shared';
import styles from '../landing.module.css';

const MENU_ITEMS = [
  { label: 'Pedidos', href: '/tracking' },
  { label: 'Endereços', href: '/profile' },
  { label: 'Pagamentos', href: '/wallet' },
  { label: 'UriPay', href: '/wallet' },
  { label: 'Notificações', href: '/notificacoes' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Ajuda', href: '/ia' },
];

const TRANSACTIONS = [
  { desc: 'Viagem UriTaxi', date: 'Hoje, 14:20', amount: -1200 },
  { desc: 'Carregamento Wallet', date: 'Ontem, 09:15', amount: 5000 },
  { desc: 'UriLojas - Supermercado', date: '22 Mai, 18:45', amount: -8450 },
];

export default function ProfilePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>U</span>
          <span className={styles.logoText}>UriGo</span>
        </Link>
        <nav className={styles.nav}>
          {['Taxi', 'Envio', 'Lojas', 'Serviços', 'Médico'].map((s) => (
            <Link key={s} href={`/${s.toLowerCase()}`}>{s}</Link>
          ))}
        </nav>
        <div className={styles.auth}>
          <Link href="/profile">Perfil</Link>
        </div>
      </header>

      <div className={styles.profileLayout}>
        <aside className={styles.profileSidebar}>
          <h2>Perfil</h2>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={item.label === 'UriPay' ? styles.menuActive : styles.menuItem}
            >
              {item.label}
            </Link>
          ))}
        </aside>

        <main className={styles.profileMain}>
          <h1>Olá, Sarah Maria</h1>

          <div className={styles.avatarSection}>
            <div className={styles.avatar}>SM</div>
            <div>
              <button type="button" className={styles.changePhotoBtn}>MUDAR FOTO</button>
              <p className={styles.photoHint}>JPG ou PNG. Max 5MB.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label>
              Nome Completo
              <input type="text" defaultValue="Sarah Maria dos Santos" />
            </label>
            <label>
              Telemóvel
              <input type="text" defaultValue="+244 923 445 210" />
            </label>
            <label>
              E-mail
              <input type="email" defaultValue="sarah.maria@gmail.com" />
            </label>
          </div>

          <div className={styles.walletSection}>
            <h3>UriPay Wallet</h3>
            <p className={styles.walletSub}>Saldo disponível</p>
            <p className={styles.walletBalance}>24.500 Kz</p>
            <div className={styles.walletActions}>
              <Link href="/wallet/carregar" className={styles.walletBtnPrimary}>+ CARREGAR</Link>
              <Link href="/wallet/sacar" className={styles.walletBtnSecondary}>LEVANTAR</Link>
              <Link href="/wallet/transferir" className={styles.walletBtnSecondary}>TRANSFERIR</Link>
            </div>
          </div>

          <div className={styles.transactionsSection}>
            <div className={styles.transactionsHeader}>
              <h3>Transações Recentes</h3>
              <button type="button" className={styles.seeAllBtn}>Ver Todas</button>
            </div>
            {TRANSACTIONS.map((tx) => (
              <div key={tx.desc} className={styles.transactionRow}>
                <div>
                  <p className={styles.txDesc}>{tx.desc}</p>
                  <p className={styles.txDate}>{tx.date}</p>
                </div>
                <span className={tx.amount > 0 ? styles.txPositive : styles.txNegative}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Kz
                </span>
              </div>
            ))}
          </div>

          <button type="button" className={styles.saveBtn}>GUARDAR ALTERAÇÕES</button>
          <button type="button" className={styles.logoutBtn}>TERMINAR SESSÃO</button>
        </main>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span className={styles.logoIcon}>U</span>
          <span>UriGo</span>
        </div>
        <div className={styles.footerLinks}>
          <span>SERVIÇOS</span>
          <span>SUPORTE</span>
          <span>APP</span>
        </div>
        <p>{getCopyrightText(DEFAULT_WHITE_LABEL)}</p>
      </footer>
    </div>
  );
}
