import { Injectable } from '@nestjs/common';
import type { SocialPlatform } from '@uritech/shared';

export interface PlatformInfo {
  platform: SocialPlatform;
  label: string;
  hasOfficialApi: boolean;
  syncSupported: boolean;
}

const HOST_RULES: { pattern: RegExp; info: PlatformInfo }[] = [
  { pattern: /facebook\.com|fb\.com|fb\.me/i, info: { platform: 'facebook', label: 'Facebook Marketplace', hasOfficialApi: false, syncSupported: false } },
  { pattern: /instagram\.com/i, info: { platform: 'instagram', label: 'Instagram', hasOfficialApi: false, syncSupported: false } },
  { pattern: /tiktok\.com/i, info: { platform: 'tiktok', label: 'TikTok Shop', hasOfficialApi: false, syncSupported: false } },
  { pattern: /wa\.me|whatsapp\.com|api\.whatsapp/i, info: { platform: 'whatsapp', label: 'WhatsApp Business', hasOfficialApi: false, syncSupported: false } },
  { pattern: /olx\.(ao|co\.za|pt|com)/i, info: { platform: 'olx', label: 'OLX', hasOfficialApi: false, syncSupported: false } },
  { pattern: /mercadolivre\.|mercadolibre\./i, info: { platform: 'mercadolivre', label: 'Mercado Livre', hasOfficialApi: true, syncSupported: true } },
  { pattern: /ebay\.(com|co\.uk)/i, info: { platform: 'ebay', label: 'eBay', hasOfficialApi: true, syncSupported: true } },
  { pattern: /alibaba\.com/i, info: { platform: 'alibaba', label: 'Alibaba', hasOfficialApi: false, syncSupported: false } },
  { pattern: /aliexpress\.com/i, info: { platform: 'aliexpress', label: 'AliExpress', hasOfficialApi: false, syncSupported: false } },
  { pattern: /pinterest\.com/i, info: { platform: 'pinterest', label: 'Pinterest', hasOfficialApi: false, syncSupported: false } },
  { pattern: /linkedin\.com/i, info: { platform: 'linkedin', label: 'LinkedIn', hasOfficialApi: false, syncSupported: false } },
  { pattern: /twitter\.com|x\.com/i, info: { platform: 'twitter', label: 'X (Twitter)', hasOfficialApi: false, syncSupported: false } },
  { pattern: /youtube\.com|youtu\.be/i, info: { platform: 'youtube', label: 'YouTube', hasOfficialApi: false, syncSupported: false } },
];

@Injectable()
export class PlatformDetectorService {
  detect(url: string): PlatformInfo {
    try {
      const hostname = new URL(url).hostname;
      for (const rule of HOST_RULES) {
        if (rule.pattern.test(hostname) || rule.pattern.test(url)) {
          return rule.info;
        }
      }
    } catch {
      /* invalid url */
    }
    return { platform: 'other', label: 'Rede Social', hasOfficialApi: false, syncSupported: false };
  }
}
