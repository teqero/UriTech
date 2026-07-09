/** Catálogo Gojek-style — on-demand (52+) e categorias loja (10) */

export interface OnDemandCatalogItem {
  id: string;
  name: string;
  category: string;
  providersCount: number;
  priceFrom: number;
  enabled: boolean;
}

export interface StoreCategoryItem {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface HomeTile {
  label: string;
  route: string;
  icon: string;
  desc?: string;
}

/** 14 componentes adicionais + rotas antes órfãs (PDF parte 2) */
export const ADDITIONAL_HOME_TILES: HomeTile[] = [
  { label: 'Rastrear Família', route: '/familia', icon: '👨‍👩‍👧', desc: 'Localização em tempo real' },
  { label: 'Negócios Próximos', route: '/negocios', icon: '🏪', desc: 'Yellow Pages local' },
  { label: 'Cuidado Automóvel', route: '/automovel', icon: '🚗', desc: 'Lavagem, bateria, óleo' },
  { label: 'Assistência SOS', route: '/assistencia', icon: '🆘', desc: 'Reboque e estrada' },
  { label: 'Genie & Runner', route: '/genie', icon: '✨', desc: 'Compras por si' },
  { label: 'Marketplace', route: '/marketplace', icon: '🛍️', desc: 'Imóveis, carros, itens' },
  { label: 'Licitar Serviços', route: '/licitar', icon: '🔧', desc: 'inDrive-style' },
  { label: 'IA UriGo', route: '/ia-urigo', icon: '🤖', desc: 'Surge, fraude, WhatsApp' },
];

export const STORE_DELIVERY_CATEGORIES: StoreCategoryItem[] = [
  { id: '1', name: 'Supermercado', icon: '🛒', enabled: true },
  { id: '2', name: 'Farmácia', icon: '💊', enabled: true },
  { id: '3', name: 'Flores', icon: '💐', enabled: true },
  { id: '4', name: 'Água', icon: '💧', enabled: true },
  { id: '5', name: 'Comida & Restaurantes', icon: '🍔', enabled: true },
  { id: '6', name: 'Frutas & Vegetais', icon: '🥬', enabled: true },
  { id: '7', name: 'Vinho & Bebidas', icon: '🍷', enabled: true },
  { id: '8', name: 'Papelaria', icon: '📎', enabled: true },
  { id: '9', name: 'Padaria', icon: '🥖', enabled: true },
  { id: '10', name: 'Pet Shop', icon: '🐾', enabled: true },
];

export const ON_DEMAND_SERVICES: OnDemandCatalogItem[] = [
  { id: '1', name: 'DJ', category: 'Entretenimento', providersCount: 12, priceFrom: 15000, enabled: true },
  { id: '2', name: 'Segurança', category: 'Segurança', providersCount: 45, priceFrom: 8000, enabled: true },
  { id: '3', name: 'Fisioterapeuta', category: 'Saúde', providersCount: 8, priceFrom: 12500, enabled: true },
  { id: '4', name: 'Técnico Móvel', category: 'Tecnologia', providersCount: 28, priceFrom: 3500, enabled: true },
  { id: '5', name: 'Babysitter', category: 'Cuidados', providersCount: 15, priceFrom: 4500, enabled: true },
  { id: '6', name: 'Empregada', category: 'Doméstico', providersCount: 60, priceFrom: 2500, enabled: true },
  { id: '7', name: 'Limpeza', category: 'Doméstico', providersCount: 34, priceFrom: 3000, enabled: true },
  { id: '8', name: 'Eletricista', category: 'Reparações', providersCount: 19, priceFrom: 5000, enabled: true },
  { id: '9', name: 'Canalizador', category: 'Reparações', providersCount: 22, priceFrom: 5000, enabled: true },
  { id: '10', name: 'Pintor', category: 'Reparações', providersCount: 14, priceFrom: 6000, enabled: true },
  { id: '11', name: 'Mecânico', category: 'Automóvel', providersCount: 41, priceFrom: 7500, enabled: true },
  { id: '12', name: 'Fotógrafo', category: 'Entretenimento', providersCount: 18, priceFrom: 10000, enabled: true },
  { id: '13', name: 'Exterminador Pragas', category: 'Doméstico', providersCount: 11, priceFrom: 9000, enabled: true },
  { id: '14', name: 'Jardineiro', category: 'Doméstico', providersCount: 20, priceFrom: 4000, enabled: true },
  { id: '15', name: 'Carpinteiro', category: 'Reparações', providersCount: 16, priceFrom: 7000, enabled: true },
  { id: '16', name: 'Serralheiro', category: 'Reparações', providersCount: 13, priceFrom: 6500, enabled: true },
  { id: '17', name: 'Vidraceiro', category: 'Reparações', providersCount: 9, priceFrom: 8000, enabled: true },
  { id: '18', name: 'Ar Condicionado', category: 'Reparações', providersCount: 24, priceFrom: 12000, enabled: true },
  { id: '19', name: 'Informático', category: 'Tecnologia', providersCount: 31, priceFrom: 4500, enabled: true },
  { id: '20', name: 'Instalação TV/Net', category: 'Tecnologia', providersCount: 17, priceFrom: 5500, enabled: true },
  { id: '21', name: 'Professor Particular', category: 'Educação', providersCount: 38, priceFrom: 6000, enabled: true },
  { id: '22', name: 'Tradutor', category: 'Educação', providersCount: 7, priceFrom: 8000, enabled: true },
  { id: '23', name: 'Personal Trainer', category: 'Saúde', providersCount: 22, priceFrom: 10000, enabled: true },
  { id: '24', name: 'Yoga & Meditação', category: 'Saúde', providersCount: 14, priceFrom: 7500, enabled: true },
  { id: '25', name: 'Nutricionista', category: 'Saúde', providersCount: 10, priceFrom: 15000, enabled: true },
  { id: '26', name: 'Enfermeiro Domicílio', category: 'Saúde', providersCount: 19, priceFrom: 11000, enabled: true },
  { id: '27', name: 'Cuidador Idosos', category: 'Saúde', providersCount: 26, priceFrom: 8500, enabled: true },
  { id: '28', name: 'Massagista', category: 'Beleza', providersCount: 33, priceFrom: 8000, enabled: true },
  { id: '29', name: 'Cabeleireiro Domicílio', category: 'Beleza', providersCount: 40, priceFrom: 3500, enabled: true },
  { id: '30', name: 'Maquilhador', category: 'Beleza', providersCount: 21, priceFrom: 12000, enabled: true },
  { id: '31', name: 'Manicure & Pedicure', category: 'Beleza', providersCount: 35, priceFrom: 2500, enabled: true },
  { id: '32', name: 'Barbeiro Domicílio', category: 'Beleza', providersCount: 29, priceFrom: 2000, enabled: true },
  { id: '33', name: 'Chef Privado', category: 'Entretenimento', providersCount: 8, priceFrom: 25000, enabled: true },
  { id: '34', name: 'Bartender', category: 'Entretenimento', providersCount: 6, priceFrom: 18000, enabled: true },
  { id: '35', name: 'Organizador Eventos', category: 'Entretenimento', providersCount: 11, priceFrom: 35000, enabled: true },
  { id: '36', name: 'Motorista Privado', category: 'Automóvel', providersCount: 52, priceFrom: 5000, enabled: true },
  { id: '37', name: 'Guia Turístico', category: 'Entretenimento', providersCount: 15, priceFrom: 14000, enabled: true },
  { id: '38', name: 'Advogado Consulta', category: 'Profissional', providersCount: 12, priceFrom: 20000, enabled: true },
  { id: '39', name: 'Contabilista', category: 'Profissional', providersCount: 9, priceFrom: 15000, enabled: true },
  { id: '40', name: 'Consultor Imobiliário', category: 'Profissional', providersCount: 18, priceFrom: 0, enabled: true },
  { id: '41', name: 'Designer Gráfico', category: 'Profissional', providersCount: 14, priceFrom: 12000, enabled: true },
  { id: '42', name: 'Programador Freelance', category: 'Tecnologia', providersCount: 27, priceFrom: 18000, enabled: true },
  { id: '43', name: 'Montagem Móveis', category: 'Reparações', providersCount: 23, priceFrom: 4500, enabled: true },
  { id: '44', name: 'Mudanças & Carretos', category: 'Logística', providersCount: 30, priceFrom: 15000, enabled: true },
  { id: '45', name: 'Desinfestação', category: 'Doméstico', providersCount: 10, priceFrom: 9500, enabled: true },
  { id: '46', name: 'Lavagem Carpetes', category: 'Doméstico', providersCount: 8, priceFrom: 7000, enabled: true },
  { id: '47', name: 'Passadeira Roupa', category: 'Doméstico', providersCount: 25, priceFrom: 2000, enabled: true },
  { id: '48', name: 'Cozinheiro', category: 'Doméstico', providersCount: 16, priceFrom: 6000, enabled: true },
  { id: '49', name: 'Pet Walker', category: 'Pet Care', providersCount: 19, priceFrom: 3500, enabled: true },
  { id: '50', name: 'Pet Grooming', category: 'Pet Care', providersCount: 12, priceFrom: 5000, enabled: true },
  { id: '51', name: 'Veterinário Domicílio', category: 'Pet Care', providersCount: 7, priceFrom: 18000, enabled: true },
  { id: '52', name: 'Astrologia & Tarot', category: 'Consultoria', providersCount: 5, priceFrom: 8000, enabled: true },
];

export function getEnabledOnDemandServices(): OnDemandCatalogItem[] {
  return ON_DEMAND_SERVICES.filter((s) => s.enabled);
}

export function getEnabledStoreCategories(): StoreCategoryItem[] {
  return STORE_DELIVERY_CATEGORIES.filter((c) => c.enabled);
}
