'use client';

import Link from 'next/link';
import { DestinationSearch } from '@/components/DestinationSearch';
import { DEFAULT_WHITE_LABEL, HOMEPAGE_SERVICES, SERVICES, getCopyrightText, getServiceByType } from '@uritech/shared';
import styles from './landing.module.css';

const NAV_LINKS = [
  { href: '/taxi', label: 'Taxi' },
  { href: '/envio', label: 'Envio' },
  { href: '/lojas', label: 'Lojas' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/pool', label: 'Pool' },
  { href: '/uriprova', label: 'UriProva' },
] as const;

export default function LandingPage() {
  const securePay = getServiceByType('securepay');
  const uriProva = getServiceByType('uriprova');
  const homepageServices = SERVICES.filter((s) => HOMEPAGE_SERVICES.includes(s.type as typeof HOMEPAGE_SERVICES[number]));
  const moreServices = SERVICES.filter(
    (s) => !HOMEPAGE_SERVICES.includes(s.type as typeof HOMEPAGE_SERVICES[number])
      && s.type !== 'securepay' && s.type !== 'uriprova',
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>U</span>
          <span className={styles.logoText}>UriGo</span>
        </div>
        <nav className={styles.nav}>
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className={styles.auth}>
          <Link href="/login">Entrar</Link>
          <Link href="/login" className={styles.registerBtn}>CADASTRAR</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <h1>Tudo o que você precisa, num só lugar.</h1>
        <DestinationSearch variant="hero" />
      </section>

      <section className={styles.services}>
        <h2>Explorar Serviços UriGo</h2>

        {(securePay || uriProva) && (
          <div className={styles.servicesFeatured}>
            {securePay ? (
              <Link href="/securepay" className={`${styles.serviceCard} ${styles.serviceCardFeatured}`}>
                <span className={styles.serviceIcon}>{securePay.icon}</span>
                <span className={styles.serviceName}>{securePay.name}</span>
                <span className={styles.serviceDesc}>{securePay.description}</span>
              </Link>
            ) : null}
            {uriProva ? (
              <Link href="/uriprova" className={`${styles.serviceCard} ${styles.serviceCardFeatured}`} style={{ borderColor: '#0D47A1', background: '#f0f4ff' }}>
                <span className={styles.serviceIcon}>{uriProva.icon}</span>
                <span className={styles.serviceName}>{uriProva.name}</span>
                <span className={styles.serviceDesc}>{uriProva.description}</span>
              </Link>
            ) : null}
          </div>
        )}

        <div className={styles.servicesGrid}>
          {homepageServices.map((s) => (
            <Link key={s.id} href={`/${s.type}`} className={styles.serviceCard}>
              <span className={styles.serviceIcon}>{s.icon}</span>
              <span className={styles.serviceName}>{s.name}</span>
              <span className={styles.serviceDesc}>{s.description}</span>
            </Link>
          ))}
        </div>

        {moreServices.length > 0 ? (
          <>
            <h3 style={{ marginTop: 32, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Mais serviços</h3>
            <div className={styles.servicesGrid}>
              {moreServices.map((s) => (
                <Link key={s.id} href={`/${s.type}`} className={styles.serviceCard}>
                  <span className={styles.serviceIcon}>{s.icon}</span>
                  <span className={styles.serviceName}>{s.name}</span>
                  <span className={styles.serviceDesc}>{s.description}</span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className={styles.appPromo}>
        <h2>Leve a UriGo no seu bolso</h2>
        <div className={styles.storeButtons}>
          <button>App Store</button>
          <button>Play Store</button>
        </div>
      </section>

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
