import type { ClaimMediaType, IncidentType, Insurer } from './types';
import { DEFAULT_CITY, DEFAULT_COUNTRY } from './constants';

export const URIPROVA_TAGLINE = 'Evidências certificadas de sinistro para seguradoras';

export const URIPROVA_CAPTURE_STEPS: { id: string; label: string; type: ClaimMediaType; hint: string }[] = [
  { id: 'scene', label: 'Panorâmica do local', type: 'photo', hint: 'Fotografe o cenário completo do acidente' },
  { id: 'damage', label: 'Danos nos veículos', type: 'photo', hint: 'Close-up de todas as áreas danificadas' },
  { id: 'plates', label: 'Matrículas e documentos', type: 'photo', hint: 'Chapa, carta verde e BI do condutor' },
  { id: 'video', label: 'Vídeo do sinistro', type: 'video', hint: 'Grave 30–60s em movimento lento à volta' },
  { id: 'audio', label: 'Declaração em áudio', type: 'audio', hint: 'Descreva o que aconteceu com data e hora' },
  { id: 'witness', label: 'Testemunhas (opcional)', type: 'photo', hint: 'Foto ou vídeo com consentimento' },
];

export const INCIDENT_TYPES: { value: IncidentType; label: string; icon: string }[] = [
  { value: 'colisao', label: 'Colisão', icon: '💥' },
  { value: 'capotamento', label: 'Capotamento', icon: '🔄' },
  { value: 'atropelamento', label: 'Atropelamento', icon: '🚶' },
  { value: 'incendio', label: 'Incêndio', icon: '🔥' },
  { value: 'roubo', label: 'Roubo / Furto', icon: '🚨' },
  { value: 'vidros', label: 'Vidros / Partes', icon: '🪟' },
  { value: 'outro', label: 'Outro', icon: '📋' },
];

export const URIPROVA_VALUE_PROPS = [
  'GPS + carimbo temporal imutável em cada ficheiro',
  'Hash de integridade (cadeia de custódia digital)',
  'Envio directo à seguradora via API segura',
  'Reduz fraude e acelera indemnizações',
  'Integração com IA UriGo para detecção de anomalias',
  'Conformidade para auditoria e reguladores',
];

export const DEMO_INSURERS: Insurer[] = [
  {
    id: 'ins-1',
    name: 'ENSA — Empresa Nacional de Seguros',
    code: 'ENSA',
    contactEmail: 'sinistros@ensa.co.ao',
    contactPhone: '+244 222 000 111',
    apiWebhookUrl: 'https://api.ensa.co.ao/uriprova/webhook',
    platformFeePerClaim: 2500,
    platformFeeMonthly: 150000,
    active: true,
    mandatedForClients: true,
    clientsCount: 12400,
    claimsThisMonth: 89,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'ins-2',
    name: 'Nossa Seguros',
    code: 'NOSSA',
    contactEmail: 'claims@nossaseguros.ao',
    contactPhone: '+244 222 000 222',
    apiWebhookUrl: 'https://api.nossaseguros.ao/v1/claims',
    platformFeePerClaim: 2200,
    platformFeeMonthly: 120000,
    active: true,
    mandatedForClients: true,
    clientsCount: 8200,
    claimsThisMonth: 54,
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'ins-3',
    name: 'Global Seguros',
    code: 'GLOBAL',
    contactEmail: 'sinistros@globalseguros.ao',
    contactPhone: '+244 222 000 333',
    platformFeePerClaim: 2000,
    platformFeeMonthly: 95000,
    active: true,
    mandatedForClients: false,
    clientsCount: 5100,
    claimsThisMonth: 31,
    createdAt: '2025-06-10T00:00:00Z',
  },
];

export function generateClaimReference(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `URI-CLM-${n}`;
}

export function generateIntegrityHash(parts: string[]): string {
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `UP-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

export const URIPROVA_DEFAULT_LOCATION = {
  latitude: -8.8383,
  longitude: 13.2344,
  address: `Av. 4 de Fevereiro, ${DEFAULT_CITY}`,
  city: DEFAULT_CITY,
  province: DEFAULT_CITY,
  country: DEFAULT_COUNTRY,
};
