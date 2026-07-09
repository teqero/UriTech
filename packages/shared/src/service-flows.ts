import type { ServiceType } from './types';

const VALID_SERVICE_TYPES = new Set<ServiceType>([
  'taxi',
  'envio',
  'lojas',
  'servicos',
  'medico',
  'beleza',
  'imoveis',
  'carros',
  'petcare',
  'partilha',
  'genie',
  'marketplace',
  'pay',
  'securepay',
  'uriprova',
]);

/** Mapeia rotas mobile/web para ServiceType persistido na API. */
export function resolveOrderServiceType(serviceKey: string): ServiceType {
  const aliases: Record<string, ServiceType> = {
    agendar: 'servicos',
    assistencia: 'servicos',
    automovel: 'servicos',
    intercidades: 'servicos',
    licitar: 'servicos',
    pool: 'partilha',
    food: 'lojas',
    'video-consulta': 'medico',
  };
  if (aliases[serviceKey]) return aliases[serviceKey];
  if (VALID_SERVICE_TYPES.has(serviceKey as ServiceType)) return serviceKey as ServiceType;
  return 'servicos';
}

/** Fluxos pós-selecção de serviço (PDF partes 1–3, padrão Gojek/InDrive) */

export const WEB_SERVICE_CONTINUE: Record<
  string,
  { href: string; label: string }
> = {
  envio: { href: '/tracking?service=envio&ref=URI-98450', label: 'SOLICITAR ENVIO' },
  lojas: { href: '/food', label: 'ESCOLHER LOJA' },
  servicos: { href: '/tracking?service=servicos&ref=URI-98451', label: 'SOLICITAR SERVIÇO' },
  medico: { href: '/tracking?service=medico&ref=URI-98452', label: 'AGENDAR CONSULTA' },
  beleza: { href: '/tracking?service=beleza&ref=URI-98453', label: 'RESERVAR HORÁRIO' },
  securepay: { href: '/securepay', label: 'CRIAR SECUREPAY' },
  uriprova: { href: '/uriprova', label: 'REPORTAR SINISTRO' },
  taxi: { href: '/taxi', label: 'RESERVAR TAXI' },
  partilha: { href: '/partilha', label: 'ENCONTRAR VIAGEM' },
  genie: { href: '/genie', label: 'SOLICITAR GENIE' },
  imoveis: { href: '/marketplace', label: 'VER IMÓVEIS' },
  carros: { href: '/marketplace', label: 'VER CARROS' },
  petcare: { href: '/beleza?tab=pet', label: 'CUIDADOS PET' },
  pool: { href: '/pool', label: 'ENTRAR NO POOL' },
  intercidades: { href: '/intercidades', label: 'PESQUISAR VIAGENS' },
  agendar: { href: '/agendar', label: 'AGENDAR' },
  wallet: { href: '/wallet', label: 'ABRIR URIPAY' },
};

export const SERVICE_LABELS: Record<string, string> = {
  taxi: 'Taxi',
  envio: 'Envio',
  lojas: 'Lojas',
  servicos: 'Serviços',
  medico: 'Médico',
  beleza: 'Beleza',
  securepay: 'SecurePay',
  uriprova: 'UriProva',
  partilha: 'Partilha',
  genie: 'Genie',
  imoveis: 'Imóveis',
  carros: 'Carros',
  petcare: 'Pet Care',
};
