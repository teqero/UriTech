import type { Location } from './types';

export interface DemoPlace extends Location {
  id: string;
  name: string;
  district: string;
}

export const DEFAULT_ORIGIN: DemoPlace = {
  id: 'origin',
  name: 'Rua Major Kanhangulo',
  district: 'Ingombota',
  latitude: -8.8147,
  longitude: 13.2302,
  address: 'Rua Major Kanhangulo, Luanda',
  city: 'Luanda',
  province: 'Luanda',
};

/** Locais demo em Luanda (dados estáticos — sem API de mapas) */
export const DEMO_PLACES: DemoPlace[] = [
  {
    id: '1',
    name: 'Aeroporto 4 de Fevereiro',
    district: 'Ingombota',
    latitude: -8.8583,
    longitude: 13.2312,
    address: 'Aeroporto Internacional 4 de Fevereiro, Luanda',
    city: 'Luanda',
  },
  {
    id: '2',
    name: 'Ilha de Luanda',
    district: 'Ilha',
    latitude: -8.8089,
    longitude: 13.2344,
    address: 'Ilha de Luanda, Luanda',
    city: 'Luanda',
  },
  {
    id: '3',
    name: 'Shopping Avenida',
    district: 'Talatona',
    latitude: -8.9168,
    longitude: 13.2034,
    address: 'Shopping Avenida, Talatona',
    city: 'Luanda',
  },
  {
    id: '4',
    name: 'Belas Shopping',
    district: 'Belas',
    latitude: -8.9985,
    longitude: 13.2658,
    address: 'Belas Shopping, Luanda',
    city: 'Luanda',
  },
  {
    id: '5',
    name: 'Hospital Josina Machel',
    district: 'Sambizanga',
    latitude: -8.8363,
    longitude: 13.2578,
    address: 'Hospital Josina Machel, Luanda',
    city: 'Luanda',
  },
  {
    id: '6',
    name: 'Marginal de Luanda',
    district: 'Ingombota',
    latitude: -8.8095,
    longitude: 13.2356,
    address: 'Marginal, Luanda',
    city: 'Luanda',
  },
  {
    id: '7',
    name: 'Universidade Agostinho Neto',
    district: 'Talatona',
    latitude: -8.9189,
    longitude: 13.1889,
    address: 'Campus Universitário, Talatona',
    city: 'Luanda',
  },
  {
    id: '8',
    name: 'Centralidade do Kilamba',
    district: 'Kilamba',
    latitude: -9.0095,
    longitude: 13.2712,
    address: 'Centralidade do Kilamba, Luanda',
    city: 'Luanda',
  },
  {
    id: '9',
    name: 'Fortaleza de São Miguel',
    district: 'Ingombota',
    latitude: -8.8098,
    longitude: 13.2319,
    address: 'Fortaleza de São Miguel, Luanda',
    city: 'Luanda',
  },
  {
    id: '10',
    name: 'Mercado do Roque Santeiro',
    district: 'Ingombota',
    latitude: -8.8124,
    longitude: 13.2289,
    address: 'Mercado Roque Santeiro, Luanda',
    city: 'Luanda',
  },
];

export function formatPlaceLabel(place: DemoPlace): string {
  return place.address ?? `${place.name}, ${place.district}`;
}

export function searchDemoPlaces(query: string, limit = 6): DemoPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_PLACES.slice(0, limit);
  return DEMO_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (p.address?.toLowerCase().includes(q) ?? false),
  ).slice(0, limit);
}

export function resolveDemoPlace(query: string): DemoPlace | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const exact = DEMO_PLACES.find(
    (p) => p.name.toLowerCase() === q || p.address?.toLowerCase() === q,
  );
  if (exact) return exact;
  return searchDemoPlaces(q, 1)[0];
}

/** Melhor correspondência enquanto o utilizador escreve (≥2 caracteres) */
export function previewDemoPlace(query: string): DemoPlace | undefined {
  const q = query.trim();
  if (q.length < 2) return undefined;
  return resolveDemoPlace(q);
}

/** URL embed OpenStreetMap (demo, sem chave API) */
export function getMapEmbedUrl(origin: Location, destination?: Location): string {
  if (!destination) {
    const { latitude: lat, longitude: lng } = origin;
    const pad = 0.04;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - pad}%2C${lat - pad}%2C${lng + pad}%2C${lat + pad}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  const minLat = Math.min(origin.latitude, destination.latitude) - 0.02;
  const maxLat = Math.max(origin.latitude, destination.latitude) + 0.02;
  const minLng = Math.min(origin.longitude, destination.longitude) - 0.02;
  const maxLng = Math.max(origin.longitude, destination.longitude) + 0.02;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${origin.latitude}%2C${origin.longitude}&marker=${destination.latitude}%2C${destination.longitude}`;
}

/** Imagem estática OSM — funciona em React Native e web */
export function getStaticMapUrl(origin: Location, destination?: Location, size = '600x280'): string {
  const center = destination
    ? `${(origin.latitude + destination.latitude) / 2},${(origin.longitude + destination.longitude) / 2}`
    : `${origin.latitude},${origin.longitude}`;
  const markers = destination
    ? `markers=${origin.latitude},${origin.longitude},red-p|${destination.latitude},${destination.longitude},blue-p`
    : `markers=${origin.latitude},${origin.longitude},red-p`;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=13&size=${size}&${markers}`;
}

export function estimateRideMinutes(origin: Location, destination: Location): number {
  const dLat = Math.abs(origin.latitude - destination.latitude);
  const dLng = Math.abs(origin.longitude - destination.longitude);
  const km = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  return Math.max(5, Math.round(km * 3 + 4));
}
