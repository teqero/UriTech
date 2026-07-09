'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Save, Trash2, Upload } from 'lucide-react';
import {
  ANGOLA_PROVINCES,
  COUNTRIES,
  CURRENCY_OPTIONS,
  DEFAULT_WHITE_LABEL,
  type WhiteLabelConfig,
  applyBrandTheme,
  getCopyrightText,
  readImageFile,
} from '@uritech/shared';
import { settingsApi } from '@/lib/api';
import styles from '../../dashboard.module.css';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 512 * 1024;

function ImageUploadField({
  label,
  value,
  maxBytes,
  hint,
  onChange,
}: {
  label: string;
  value?: string;
  maxBytes: number;
  hint: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const dataUrl = await readImageFile(file, maxBytes);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar imagem.');
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 12,
            border: '2px dashed var(--gray-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'var(--gray-50, #f9fafb)',
            flexShrink: 0,
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <ImagePlus size={28} color="var(--gray-300, #d1d5db)" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                background: 'white',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Upload size={16} /> Carregar ficheiro
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--gray-100)',
                  color: 'var(--error, #dc2626)',
                  background: 'white',
                  fontSize: 13,
                }}
              >
                <Trash2 size={16} /> Remover
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{hint}</p>
          <input
            type="text"
            placeholder="Ou cole uma URL (https://...)"
            value={value?.startsWith('data:') ? '' : (value || '')}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-100)', borderRadius: 8, fontSize: 13 }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--error, #dc2626)', marginTop: 6 }}>{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico"
        style={{ display: 'none' }}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function MarcaPage() {
  const [brand, setBrand] = useState<WhiteLabelConfig>(DEFAULT_WHITE_LABEL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    settingsApi.getBrand()
      .then((data) => {
        setBrand(data);
        applyBrandTheme(data);
        applyFavicon(data.faviconUrl || data.logoUrl);
      })
      .catch(() => setBrand(DEFAULT_WHITE_LABEL));
  }, []);

  const applyFavicon = (href?: string) => {
    if (!href || typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  };

  const update = (field: keyof WhiteLabelConfig, value: string) => {
    setBrand((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await settingsApi.updateBrand(brand);
      setBrand(updated);
      applyBrandTheme(updated);
      applyFavicon(updated.faviconUrl || updated.logoUrl);
      setMessage('Identidade visual guardada com sucesso.');
    } catch {
      setMessage('Erro ao guardar. Verifique se o backend está activo.');
    } finally {
      setSaving(false);
    }
  };

  const copyright = getCopyrightText(brand);

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontSize: 14, marginBottom: 8 }}>
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1>White-Label — Identidade Visual</h1>
          <p>Personalize cores, nome e identidade da aplicação</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
        >
          <Save size={18} /> {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>

      {message && (
        <div style={{ padding: 12, borderRadius: 10, marginBottom: 20, background: message.includes('sucesso') ? 'var(--primary-light)' : '#FFF0F0', color: message.includes('sucesso') ? 'var(--primary-dark)' : 'var(--error)' }}>
          {message}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Marca</h2>
          {[
            { key: 'appName' as const, label: 'Nome da Aplicação' },
            { key: 'tagline' as const, label: 'Tagline' },
            { key: 'fontFamily' as const, label: 'Fonte (ex: Inter)' },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type="text"
                value={brand[key] || ''}
                onChange={(e) => update(key, e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }}
              />
            </div>
          ))}

          <ImageUploadField
            label="Logo"
            value={brand.logoUrl}
            maxBytes={LOGO_MAX_BYTES}
            hint="PNG, JPG, WebP ou GIF. Máximo 2 MB."
            onChange={(url) => update('logoUrl', url)}
          />
          <ImageUploadField
            label="Favicon"
            value={brand.faviconUrl}
            maxBytes={FAVICON_MAX_BYTES}
            hint="ICO, PNG ou JPG. Máximo 512 KB. Recomendado 32×32 px."
            onChange={(url) => update('faviconUrl', url)}
          />
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Cores</h2>
          {[
            { key: 'primaryColor' as const, label: 'Cor Primária' },
            { key: 'primaryDark' as const, label: 'Primária Escura' },
            { key: 'primaryLight' as const, label: 'Primária Clara' },
            { key: 'secondaryColor' as const, label: 'Cor Secundária' },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={brand[key]} onChange={(e) => update(key, e.target.value)} style={{ width: 48, height: 40, border: 'none', cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type="text" value={brand[key]} onChange={(e) => update(key, e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--gray-100)', borderRadius: 8, fontSize: 14 }} />
              </div>
            </div>
          ))}

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>Pré-visualização</h3>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
            <div style={{ background: brand.primaryColor, color: 'white', padding: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  {brand.appName.charAt(0)}
                </span>
              )}
              {brand.appName}
            </div>
            <div style={{ padding: 16, background: brand.primaryLight }}>
              <p style={{ fontSize: 13, color: brand.primaryDark }}>{brand.tagline}</p>
              <button style={{ marginTop: 12, background: brand.secondaryColor, color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Botão Secundário</button>
            </div>
            <div style={{ padding: 12, background: '#1a1a2e', color: '#aaa', fontSize: 11, textAlign: 'center' }}>
              {copyright}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Localização e Contacto</h2>
        <div className={styles.grid}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Cidade Padrão</label>
            <select
              value={brand.defaultCity}
              onChange={(e) => update('defaultCity', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14, background: 'white' }}
            >
              {ANGOLA_PROVINCES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
              {!ANGOLA_PROVINCES.includes(brand.defaultCity) && brand.defaultCity && (
                <option value={brand.defaultCity}>{brand.defaultCity}</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>País Padrão</label>
            <select
              value={brand.defaultCountry}
              onChange={(e) => update('defaultCountry', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14, background: 'white' }}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
              {!COUNTRIES.includes(brand.defaultCountry) && brand.defaultCountry && (
                <option value={brand.defaultCountry}>{brand.defaultCountry}</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>Símbolo Moeda</label>
            <select
              value={brand.currencySymbol}
              onChange={(e) => update('currencySymbol', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14, background: 'white' }}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.symbol}>{c.label}</option>
              ))}
              {!CURRENCY_OPTIONS.some((c) => c.symbol === brand.currencySymbol) && brand.currencySymbol && (
                <option value={brand.currencySymbol}>{brand.currencySymbol}</option>
              )}
            </select>
          </div>
          {[
            { key: 'supportEmail' as const, label: 'Email Suporte' },
            { key: 'supportPhone' as const, label: 'Telefone Suporte' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: 13, color: 'var(--gray-500)', display: 'block', marginBottom: 6 }}>{label}</label>
              <input type="text" value={brand[key] || ''} onChange={(e) => update(key, e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--gray-100)', borderRadius: 10, fontSize: 14 }} />
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--gray-500)' }}>
          Rodapé (ano actualizado automaticamente): <strong style={{ color: 'var(--gray-700, #374151)' }}>{copyright}</strong>
        </p>
      </div>
    </div>
  );
}
