'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ESCROW_TRANSACTIONS,
  NEARBY_STORES,
  ON_DEMAND_SERVICES,
  SERVICES,
  WEB_SERVICE_CONTINUE,
  URIPROVA_VALUE_PROPS,
  URIPROVA_CAPTURE_STEPS,
  DEMO_INSURERS,
  formatCurrency,
  getServiceByType,
} from '@uritech/shared';
import styles from '../landing.module.css';

const VALID_SERVICES = ['envio', 'lojas', 'servicos', 'medico', 'beleza', 'securepay', 'uriprova', 'partilha', 'genie', 'imoveis', 'carros', 'petcare'];

const SERVICE_CONTENT: Record<string, { title: string; subtitle: string }> = {
  envio: { title: 'Enviar Encomenda', subtitle: 'Recolha e entrega rápida em toda a cidade' },
  lojas: { title: 'Lojas e Entregas', subtitle: 'Supermercados, farmácias, flores e muito mais' },
  servicos: { title: 'Serviços sob Demanda', subtitle: 'Profissionais verificados ao seu dispor' },
  medico: { title: 'Saúde e Médico', subtitle: 'Consultas, farmácia e assistência médica' },
  beleza: { title: 'Beleza e Cuidados', subtitle: 'Salões, barbearias e tratamentos' },
  securepay: { title: 'SecurePay', subtitle: 'Pagar com Segurança' },
  uriprova: { title: 'UriProva', subtitle: 'Evidências certificadas de sinistro para seguradoras' },
  partilha: { title: 'Partilha de Viagem', subtitle: 'Encontre ou ofereça lugares em viagens' },
  genie: { title: 'Genie de Compras', subtitle: 'Nós compramos e entregamos por si' },
  imoveis: { title: 'Imóveis', subtitle: 'Compra, venda e aluguer de imóveis' },
  carros: { title: 'Carros', subtitle: 'Compra e venda de veículos' },
  petcare: { title: 'Pet Care', subtitle: 'Cuidados veterinários e bem-estar animal' },
};

export default function ServicePage({ params }: { params: { service: string } }) {
  const { service } = params;
  if (!VALID_SERVICES.includes(service)) notFound();

  const meta = SERVICE_CONTENT[service];
  const info = getServiceByType(service as typeof SERVICES[number]['type']);
  const continueAction = WEB_SERVICE_CONTINUE[service] ?? { href: '/tracking', label: 'CONTINUAR' };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>{info?.icon?.slice(0, 1) ?? 'U'}</span>
          <span className={styles.logoText}>UriGo</span>
        </Link>
        <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>← Voltar</Link>
      </header>

      <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 48 }}>{info?.icon}</span>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 12 }}>{meta.title}</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>{meta.subtitle}</p>
        </div>

        {service === 'envio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Envelope', desc: 'Até 1kg', price: 500, icon: '📨' },
              { name: 'Caixa Média', desc: 'Até 5kg', price: 1200, icon: '📦' },
              { name: 'Caixa Grande', desc: 'Até 20kg', price: 2500, icon: '📫' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <span style={{ fontSize: 32 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{item.desc}</p>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.price.toLocaleString()} Kz</span>
              </div>
            ))}
          </div>
        )}

        {service === 'lojas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {NEARBY_STORES.map((store) => (
              <div key={store.id} style={{ display: 'flex', gap: 16, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <span style={{ fontSize: 32 }}>
                  {store.category === 'supermercado' ? '🛒' : store.category === 'farmacia' ? '💊' : store.category === 'flores' ? '💐' : '💧'}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{store.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>⭐ {store.rating} • {store.deliveryTime} • Taxa {store.deliveryFee} Kz</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {service === 'servicos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {ON_DEMAND_SERVICES.slice(0, 8).map((s) => (
              <div key={s.id} style={{ padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <p style={{ fontWeight: 600 }}>{s.name}</p>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>{s.category}</p>
                <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginTop: 8 }}>desde {formatCurrency(s.priceFrom)}</p>
              </div>
            ))}
          </div>
        )}

        {service === 'medico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Consulta Geral', price: 15000, icon: '🩺' },
              { name: 'Telemedicina', price: 8000, icon: '📱' },
              { name: 'Farmácia Express', price: 0, icon: '💊' },
              { name: 'Ambulância', price: 25000, icon: '🚑' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <span style={{ fontSize: 32 }}>{item.icon}</span>
                <p style={{ flex: 1, fontWeight: 600 }}>{item.name}</p>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.price ? `${item.price.toLocaleString()} Kz` : 'Sob consulta'}</span>
              </div>
            ))}
          </div>
        )}

        {service === 'beleza' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Corte de Cabelo', price: 3500, icon: '💇' },
              { name: 'Manicure', price: 2500, icon: '💅' },
              { name: 'Barbearia', price: 2000, icon: '✂️' },
              { name: 'Spa & Massagem', price: 12000, icon: '🧖' },
            ].map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12 }}>
                <span style={{ fontSize: 32 }}>{item.icon}</span>
                <p style={{ flex: 1, fontWeight: 600 }}>{item.name}</p>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.price.toLocaleString()} Kz</span>
              </div>
            ))}
          </div>
        )}

        {service === 'securepay' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #6C63FF, #4A42D4)', color: 'white', padding: 24, borderRadius: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 700 }}>Pague com Segurança</p>
              <p style={{ fontSize: 14, opacity: 0.9, marginTop: 8 }}>Proteja compras feitas nas redes sociais. O valor fica retido até confirmar a entrega.</p>
            </div>
            {[
              'Comprador deposita valor em Kz no SecurePay',
              'Vendedor recebe confirmação e envia produto',
              'Comprador confirma recepção',
              'Valor libertado ao vendedor',
            ].map((step, i) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                <p style={{ fontSize: 14, paddingTop: 4 }}>{step}</p>
              </div>
            ))}
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 12px' }}>Transações Activas</h3>
            {ESCROW_TRANSACTIONS.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, border: '1px solid var(--gray-100)', borderRadius: 12, marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{tx.product}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{tx.role} • {formatCurrency(tx.amount)}</p>
                </div>
                <span style={{ background: 'var(--primary-light, #E8F9EA)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{tx.status}</span>
              </div>
            ))}
          </>
        )}

        {service === 'uriprova' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #0D47A1, #1565C0)', color: 'white', padding: 24, borderRadius: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 700 }}>UriProva — Anti-fraude para Seguradoras</p>
              <p style={{ fontSize: 14, opacity: 0.9, marginTop: 8 }}>Capture fotos, vídeo e áudio no local do acidente. Envio directo à seguradora com GPS e hash de integridade.</p>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Valor para seguradoras</h3>
            {URIPROVA_VALUE_PROPS.map((prop) => (
              <p key={prop} style={{ fontSize: 14, marginBottom: 8 }}>✓ {prop}</p>
            ))}
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 12px' }}>Checklist de captura</h3>
            {URIPROVA_CAPTURE_STEPS.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--gray-100)', borderRadius: 12, marginBottom: 8 }}>
                <span>{s.type === 'audio' ? '🎙️' : s.type === 'video' ? '🎥' : '📷'}</span>
                <div>
                  <p style={{ fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.hint}</p>
                </div>
              </div>
            ))}
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '24px 0 12px' }}>Seguradoras parceiras</h3>
            {DEMO_INSURERS.filter((i) => i.active).map((ins) => (
              <div key={ins.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, border: '1px solid var(--gray-100)', borderRadius: 12, marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{ins.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Taxa plataforma: {formatCurrency(ins.platformFeePerClaim)}/sinistro</p>
                </div>
                {ins.mandatedForClients ? <span style={{ fontSize: 11, fontWeight: 700, color: '#F06400' }}>Obrigatório</span> : null}
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 16 }}>Use a app móvel UriGo para captura com câmara e GPS em tempo real.</p>
          </>
        )}

        <Link
          href={continueAction.href}
          style={{ display: 'block', background: 'var(--primary)', color: 'white', padding: 16, borderRadius: 12, textAlign: 'center', fontWeight: 700, marginTop: 32 }}
        >
          {continueAction.label}
        </Link>
      </div>
    </div>
  );
}
