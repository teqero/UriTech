export type MarketplaceTab = 'imoveis' | 'carros' | 'itens';

export type ListingType = 'venda' | 'aluguer';

export interface MarketplaceListing {
  id: string;
  title: string;
  type: ListingType;
  price: number;
  icon: string;
  city: string;
  /** imóveis */
  bedrooms?: number;
  /** carros */
  brand?: string;
  year?: number;
  /** itens */
  category?: string;
}

export interface MarketplaceFilters {
  type: 'all' | ListingType;
  city: string;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: 'all' | '1' | '2' | '3+';
  brand: string;
  category: string;
  sort: 'recent' | 'price_asc' | 'price_desc';
}

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  type: 'all',
  city: 'all',
  priceMin: null,
  priceMax: null,
  bedrooms: 'all',
  brand: 'all',
  category: 'all',
  sort: 'recent',
};

export const MARKETPLACE_CITIES = ['all', 'Luanda', 'Talatona', 'Kilamba', 'Benguela', 'Huambo'] as const;

export const MARKETPLACE_BRANDS = ['all', 'Toyota', 'Honda', 'Mercedes', 'Hyundai', 'Nissan'] as const;

export const MARKETPLACE_CATEGORIES = ['all', 'Electrónicos', 'Mobiliário', 'Desporto', 'Moda'] as const;

export const PRICE_PRESETS = [
  { label: 'Todos', min: null, max: null },
  { label: 'Até 500K', min: null, max: 500_000 },
  { label: '500K – 5M', min: 500_000, max: 5_000_000 },
  { label: '5M – 20M', min: 5_000_000, max: 20_000_000 },
  { label: '20M+', min: 20_000_000, max: null },
] as const;

export const MARKETPLACE_LISTINGS: Record<MarketplaceTab, MarketplaceListing[]> = {
  imoveis: [
    { id: 'i1', title: 'Vivenda T3, Talatona', type: 'venda', price: 45_000_000, icon: '🏠', city: 'Talatona', bedrooms: 3 },
    { id: 'i2', title: 'Apartamento T2, Kilamba, Bloco A', type: 'aluguer', price: 350_000, icon: '🏢', city: 'Kilamba', bedrooms: 2 },
    { id: 'i3', title: 'Condomínio Roses, Morro Bento', type: 'venda', price: 120_000_000, icon: '🏡', city: 'Luanda', bedrooms: 4 },
    { id: 'i4', title: 'T1 mobilado, Maianga', type: 'aluguer', price: 180_000, icon: '🏢', city: 'Luanda', bedrooms: 1 },
    { id: 'i5', title: 'Moradia T4, Benguela', type: 'venda', price: 28_000_000, icon: '🏠', city: 'Benguela', bedrooms: 4 },
    { id: 'i6', title: 'Loja comercial, Kilamba', type: 'aluguer', price: 420_000, icon: '🏬', city: 'Kilamba', bedrooms: 0 },
  ],
  carros: [
    { id: 'c1', title: 'Toyota Corolla 2019', type: 'venda', price: 8_500_000, icon: '🚗', city: 'Luanda', brand: 'Toyota', year: 2019 },
    { id: 'c2', title: 'Honda Fit 2021', type: 'venda', price: 12_000_000, icon: '🚙', city: 'Talatona', brand: 'Honda', year: 2021 },
    { id: 'c3', title: 'Mercedes C200 2018', type: 'venda', price: 18_500_000, icon: '🏎️', city: 'Luanda', brand: 'Mercedes', year: 2018 },
    { id: 'c4', title: 'Hyundai Tucson 2020', type: 'venda', price: 14_200_000, icon: '🚙', city: 'Benguela', brand: 'Hyundai', year: 2020 },
    { id: 'c5', title: 'Toyota Hilux 2017', type: 'venda', price: 16_800_000, icon: '🛻', city: 'Huambo', brand: 'Toyota', year: 2017 },
    { id: 'c6', title: 'Nissan March 2016', type: 'venda', price: 4_200_000, icon: '🚗', city: 'Luanda', brand: 'Nissan', year: 2016 },
  ],
  itens: [
    { id: 't1', title: 'iPhone 15 Pro', type: 'venda', price: 1_200_000, icon: '📱', city: 'Luanda', category: 'Electrónicos' },
    { id: 't2', title: 'Sofá 3 lugares', type: 'venda', price: 180_000, icon: '🛋️', city: 'Talatona', category: 'Mobiliário' },
    { id: 't3', title: 'Bicicleta eléctrica', type: 'venda', price: 95_000, icon: '🚲', city: 'Kilamba', category: 'Desporto' },
    { id: 't4', title: 'MacBook Air M2', type: 'venda', price: 980_000, icon: '💻', city: 'Luanda', category: 'Electrónicos' },
    { id: 't5', title: 'Ténis Nike Air Max', type: 'venda', price: 45_000, icon: '👟', city: 'Luanda', category: 'Moda' },
    { id: 't6', title: 'Mesa de jantar 6 lugares', type: 'venda', price: 220_000, icon: '🪑', city: 'Benguela', category: 'Mobiliário' },
  ],
};

export function countActiveFilters(filters: MarketplaceFilters, tab: MarketplaceTab): number {
  let n = 0;
  if (filters.type !== 'all') n += 1;
  if (filters.city !== 'all') n += 1;
  if (filters.priceMin !== null || filters.priceMax !== null) n += 1;
  if (tab === 'imoveis' && filters.bedrooms !== 'all') n += 1;
  if (tab === 'carros' && filters.brand !== 'all') n += 1;
  if (tab === 'itens' && filters.category !== 'all') n += 1;
  if (filters.sort !== 'recent') n += 1;
  return n;
}

export function filterMarketplaceListings(
  items: MarketplaceListing[],
  filters: MarketplaceFilters,
  tab: MarketplaceTab,
): MarketplaceListing[] {
  let result = items.filter((item) => {
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.city !== 'all' && item.city !== filters.city) return false;
    if (filters.priceMin !== null && item.price < filters.priceMin) return false;
    if (filters.priceMax !== null && item.price > filters.priceMax) return false;

    if (tab === 'imoveis' && filters.bedrooms !== 'all') {
      const beds = item.bedrooms ?? 0;
      if (filters.bedrooms === '1' && beds !== 1) return false;
      if (filters.bedrooms === '2' && beds !== 2) return false;
      if (filters.bedrooms === '3+' && beds < 3) return false;
    }

    if (tab === 'carros' && filters.brand !== 'all' && item.brand !== filters.brand) return false;

    if (tab === 'itens' && filters.category !== 'all' && item.category !== filters.category) return false;

    return true;
  });

  if (filters.sort === 'price_asc') {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price_desc') {
    result = [...result].sort((a, b) => b.price - a.price);
  }

  return result;
}
