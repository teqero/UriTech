import { Injectable } from '@nestjs/common';

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  images: string[];
  video?: string;
  videos: string[];
  price?: number;
  currency?: string;
  siteName?: string;
  type?: string;
}

@Injectable()
export class OpenGraphService {
  parse(html: string): OpenGraphData {
    const getMeta = (keys: string[]) => {
      for (const key of keys) {
        const patterns = [
          new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
          new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, 'i'),
        ];
        for (const re of patterns) {
          const m = html.match(re);
          if (m?.[1]) return this.decodeHtml(m[1].trim());
        }
      }
      return undefined;
    };

    const images = [
      getMeta(['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']),
    ].filter(Boolean) as string[];

    const allImages = [...new Set(
      [...images, ...this.extractAll(html, /property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)],
    )];

    const priceRaw = getMeta(['og:price:amount', 'product:price:amount', 'product:price']);
    const currency = getMeta(['og:price:currency', 'product:price:currency']);

    return {
      title: getMeta(['og:title', 'twitter:title']),
      description: getMeta(['og:description', 'twitter:description', 'description']),
      image: allImages[0],
      images: allImages,
      video: getMeta(['og:video', 'og:video:url', 'twitter:player']),
      videos: this.extractAll(html, /property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/gi),
      price: priceRaw ? this.parsePrice(priceRaw) : undefined,
      currency: currency ?? 'AOA',
      siteName: getMeta(['og:site_name']),
      type: getMeta(['og:type']),
    };
  }

  private extractAll(html: string, re: RegExp): string[] {
    const out: string[] = [];
    let m: RegExpExecArray | null;
    const copy = new RegExp(re.source, re.flags);
    while ((m = copy.exec(html)) !== null) {
      if (m[1]) out.push(this.decodeHtml(m[1].trim()));
    }
    return out;
  }

  private parsePrice(raw: string): number | undefined {
    const n = Number(raw.replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  private decodeHtml(s: string): string {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}
