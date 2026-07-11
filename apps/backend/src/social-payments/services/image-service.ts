import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageService {
  normalizeImages(images: string[], baseUrl: string): string[] {
    return [...new Set(
      images
        .map((img) => this.toAbsolute(baseUrl, img))
        .filter((img): img is string => !!img && img.startsWith('http')),
    )].slice(0, 8);
  }

  placeholderForPlatform(platform: string): string {
    const map: Record<string, string> = {
      facebook: '🛒',
      instagram: '📸',
      tiktok: '🎵',
      whatsapp: '💬',
      olx: '🏷️',
      mercadolivre: '🛍️',
      ebay: '🌐',
      aliexpress: '📦',
    };
    return map[platform] ?? '🔗';
  }

  private toAbsolute(base: string, url: string): string | undefined {
    try {
      return new URL(url, base).href;
    } catch {
      return url.startsWith('http') ? url : undefined;
    }
  }
}
