import { Injectable } from '@nestjs/common';
import { OpenGraphService } from './open-graph.service';
import { SchemaParserService } from './schema-parser.service';

export interface RawMetadata {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  condition?: string;
  brand?: string;
  city?: string;
  country?: string;
  images: string[];
  videos: string[];
  sellerName?: string;
}

@Injectable()
export class MetadataParserService {
  constructor(
    private readonly openGraph: OpenGraphService,
    private readonly schema: SchemaParserService,
  ) {}

  parse(html: string, pageUrl: string): RawMetadata {
    const og = this.openGraph.parse(html);
    const schema = this.schema.parse(html);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

    const images = [...new Set([...schema.images, ...og.images])].slice(0, 8);
    const videos = [...new Set(og.videos)].slice(0, 4);

    return {
      title: schema.title || og.title || titleTag,
      description: schema.description || og.description,
      price: schema.price ?? og.price,
      currency: schema.currency ?? og.currency ?? 'AOA',
      category: schema.category,
      condition: schema.condition,
      brand: schema.brand,
      city: schema.city,
      country: schema.country,
      images,
      videos,
      sellerName: schema.sellerName ?? og.siteName,
    };
  }

  extractPriceFromText(text: string): number | undefined {
    const patterns = [
      /(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(?:kz|kzs|aoa|€|\$|usd|eur)/i,
      /(?:preço|price|valor)[:\s]*(\d[\d\s.,]*)/i,
      /(\d[\d\s.,]{2,})\s*(?:kz|kzs)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m?.[1]) {
        const n = Number(m[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return undefined;
  }

  resolveAbsoluteUrl(base: string, maybeRelative?: string): string | undefined {
    if (!maybeRelative) return undefined;
    try {
      return new URL(maybeRelative, base).href;
    } catch {
      return maybeRelative.startsWith('http') ? maybeRelative : undefined;
    }
  }
}
