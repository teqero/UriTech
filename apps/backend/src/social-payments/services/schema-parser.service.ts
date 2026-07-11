import { Injectable } from '@nestjs/common';

export interface SchemaProductData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  brand?: string;
  category?: string;
  condition?: string;
  images: string[];
  sellerName?: string;
  city?: string;
  country?: string;
}

@Injectable()
export class SchemaParserService {
  parse(html: string): SchemaProductData {
    const blocks = this.extractJsonLd(html);
    for (const block of blocks) {
      const product = this.findProduct(block);
      if (product) return product;
    }
    return { images: [] };
  }

  private extractJsonLd(html: string): unknown[] {
    const results: unknown[] = [];
    const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      try {
        results.push(JSON.parse(m[1]));
      } catch {
        /* skip invalid json */
      }
    }
    return results;
  }

  private findProduct(node: unknown): SchemaProductData | null {
    if (!node || typeof node !== 'object') return null;
    const obj = node as Record<string, unknown>;

    if (Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph'] as unknown[]) {
        const found = this.findProduct(item);
        if (found) return found;
      }
    }

    const type = String(obj['@type'] ?? '').toLowerCase();
    if (type.includes('product') || type.includes('offer')) {
      return this.mapProduct(obj);
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = this.findProduct(item);
        if (found) return found;
      }
    }

    return null;
  }

  private mapProduct(obj: Record<string, unknown>): SchemaProductData {
    const offers = obj.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const offer = Array.isArray(offers) ? offers[0] : offers;

    const priceRaw = offer?.price ?? obj.price;
    const currency = String(offer?.priceCurrency ?? obj.priceCurrency ?? 'AOA');

    const images = this.collectImages(obj.image ?? offer?.image);

    const brandObj = obj.brand as Record<string, unknown> | string | undefined;
    const brand = typeof brandObj === 'string' ? brandObj : String(brandObj?.name ?? '');

    const seller = offer?.seller as Record<string, unknown> | undefined;

    return {
      title: String(obj.name ?? obj.title ?? ''),
      description: String(obj.description ?? ''),
      price: this.parsePrice(priceRaw),
      currency,
      brand: brand || undefined,
      category: String(obj.category ?? ''),
      condition: String(obj.itemCondition ?? offer?.itemCondition ?? ''),
      images,
      sellerName: seller ? String(seller.name ?? '') : undefined,
    };
  }

  private collectImages(raw: unknown): string[] {
    if (!raw) return [];
    if (typeof raw === 'string') return [raw];
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    return [];
  }

  private parsePrice(raw: unknown): number | undefined {
    if (raw == null) return undefined;
    const n = Number(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
}
