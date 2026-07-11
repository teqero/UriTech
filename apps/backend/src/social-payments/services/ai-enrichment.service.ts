import { Injectable } from '@nestjs/common';
import type { RawMetadata } from './metadata-parser.service';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Electrónicos: ['iphone', 'samsung', 'laptop', 'macbook', 'telefone', 'tablet', 'tv', 'playstation', 'xbox'],
  Moda: ['ténis', 'tenis', 'sapato', 'vestido', 'camisa', 'nike', 'adidas', 'roupa'],
  Automóvel: ['carro', 'toyota', 'mercedes', 'bmw', 'moto', 'viatura'],
  Imóveis: ['apartamento', 'moradia', 'casa', 'arrendamento', 'quarto', 'terreno'],
  Mobiliário: ['sofá', 'sofa', 'mesa', 'cadeira', 'mobília', 'mobilia'],
  Desporto: ['bicicleta', 'bike', 'futebol', 'gym', 'fitness'],
};

@Injectable()
export class AiEnrichmentService {
  enrich(raw: RawMetadata, platformLabel: string, originalUrl: string): RawMetadata & { completeness: number; aiEnriched: boolean } {
    let enriched = false;
    const title = this.cleanTitle(raw.title ?? this.inferTitleFromUrl(originalUrl));
    let description = this.cleanDescription(raw.description ?? '');
    let price = raw.price;
    let category = raw.category;
    let brand = raw.brand;
    let condition = raw.condition;
    let city = raw.city;
    let country = raw.country ?? 'Angola';

    if (!price && description) {
      const fromDesc = this.extractPrice(description);
      if (fromDesc) {
        price = fromDesc;
        enriched = true;
      }
    }

    if (!category) {
      category = this.inferCategory(`${title} ${description}`);
      if (category) enriched = true;
    }

    if (!brand) {
      brand = this.inferBrand(title);
      if (brand) enriched = true;
    }

    if (!condition && description) {
      condition = this.inferCondition(description);
      if (condition) enriched = true;
    }

    if (!city) {
      city = this.inferCity(description) ?? 'Luanda';
      enriched = true;
    }

    if (!description && title) {
      description = `Produto importado de ${platformLabel}. ${title}.`;
      enriched = true;
    }

    if (!price) {
      price = 0;
      enriched = true;
    }

    const filled = [title, description, price > 0, category, raw.images.length > 0, city, country];
    const completeness = Math.round((filled.filter(Boolean).length / filled.length) * 100);

    return {
      ...raw,
      title,
      description,
      price,
      category,
      brand,
      condition,
      city,
      country,
      completeness,
      aiEnriched: enriched,
    };
  }

  private cleanTitle(s: string): string {
    return s
      .replace(/#\w+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
  }

  private cleanDescription(s: string): string {
    return s
      .replace(/#\w+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);
  }

  private inferTitleFromUrl(url: string): string {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] ?? 'Produto';
      return slug.replace(/[-_+]/g, ' ').replace(/\.\w+$/, '');
    } catch {
      return 'Produto importado';
    }
  }

  private extractPrice(text: string): number | undefined {
    const m = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*(?:kz|kzs|aoa)/i);
    if (!m) return undefined;
    const n = Number(m[1].replace(/\s/g, '').replace(/\./g, ''));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  private inferCategory(text: string): string | undefined {
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k))) return cat;
    }
    return undefined;
  }

  private inferBrand(title: string): string | undefined {
    const brands = ['Apple', 'Samsung', 'Toyota', 'Honda', 'Nike', 'Adidas', 'Sony', 'LG', 'Huawei', 'Xiaomi'];
    const lower = title.toLowerCase();
    return brands.find((b) => lower.includes(b.toLowerCase()));
  }

  private inferCondition(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (/novo|new|selado/.test(lower)) return 'Novo';
    if (/usado|used|semi/.test(lower)) return 'Usado';
    return undefined;
  }

  private inferCity(text: string): string | undefined {
    const cities = ['Luanda', 'Benguela', 'Huambo', 'Talatona', 'Kilamba', 'Lubango', 'Cabinda'];
    const lower = text.toLowerCase();
    return cities.find((c) => lower.includes(c.toLowerCase()));
  }
}
