import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { ImportedSocialProduct } from '@uritech/shared';
import { AiEnrichmentService } from './ai-enrichment.service';
import { ImageService } from './image-service';
import { MetadataParserService } from './metadata-parser.service';
import { PlatformDetectorService } from './platform-detector.service';

const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT = 'UriPayBot/1.0 (+https://urigo.ao; social-product-import)';

@Injectable()
export class SocialImportEngine {
  private readonly logger = new Logger(SocialImportEngine.name);

  constructor(
    private readonly platformDetector: PlatformDetectorService,
    private readonly metadataParser: MetadataParserService,
    private readonly aiEnrichment: AiEnrichmentService,
    private readonly imageService: ImageService,
  ) {}

  async importFromUrl(url: string): Promise<ImportedSocialProduct> {
    const normalized = this.normalizeUrl(url);
    const platformInfo = this.platformDetector.detect(normalized);

    let html = '';
    try {
      html = await this.fetchHtml(normalized);
    } catch (err) {
      this.logger.warn(`Fetch falhou para ${normalized}: ${err instanceof Error ? err.message : String(err)}`);
    }

    const raw = this.metadataParser.parse(html, normalized);
    const enriched = this.aiEnrichment.enrich(raw, platformInfo.label, normalized);
    const images = this.imageService.normalizeImages(enriched.images, normalized);

    return {
      platform: platformInfo.platform,
      platformLabel: platformInfo.label,
      originalUrl: normalized,
      title: enriched.title || 'Produto importado',
      description: enriched.description ?? '',
      price: enriched.price ?? 0,
      currency: enriched.currency ?? 'AOA',
      category: enriched.category,
      condition: enriched.condition,
      brand: enriched.brand,
      city: enriched.city,
      country: enriched.country,
      images,
      videos: enriched.videos,
      sellerName: enriched.sellerName,
      completeness: enriched.completeness,
      aiEnriched: enriched.aiEnriched,
    };
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) throw new BadRequestException('Link do produto é obrigatório');
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return parsed.href;
    } catch {
      throw new BadRequestException('Link inválido');
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return text.slice(0, 500_000);
    } finally {
      clearTimeout(timer);
    }
  }
}
