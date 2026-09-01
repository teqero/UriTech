export interface ImportedPayload {
  platform: string;
  platformLabel: string;
  originalUrl: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category?: string;
  condition?: string;
  brand?: string;
  city?: string;
  country?: string;
  images: string[];
  videos: string[];
  sellerName?: string;
  metadata: Record<string, unknown>;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Electrónicos: ['iphone', 'samsung', 'laptop', 'macbook', 'telefone', 'tablet', 'tv', 'playstation', 'xbox'],
  Moda: ['ténis', 'tenis', 'sapato', 'vestido', 'camisa', 'nike', 'adidas', 'roupa'],
  Automóvel: ['carro', 'toyota', 'mercedes', 'bmw', 'moto', 'viatura'],
  Imóveis: ['apartamento', 'moradia', 'casa', 'arrendamento', 'quarto', 'terreno'],
  Mobiliário: ['sofá', 'sofa', 'mesa', 'cadeira', 'mobília', 'mobilia'],
  Desporto: ['bicicleta', 'bike', 'futebol', 'gym', 'fitness'],
};

const USER_AGENTS: Record<string, string> = {
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  bot: 'UriPayBot/1.0 (+https://urigo.ao; social-product-import)',
};

function detectPlatform(url: string) {
  const rules: [RegExp, string, string][] = [
    [/facebook\.com|fb\.com|fb\.me/i, 'facebook', 'Facebook Marketplace'],
    [/instagram\.com/i, 'instagram', 'Instagram'],
    [/tiktok\.com/i, 'tiktok', 'TikTok Shop'],
    [/wa\.me|whatsapp\.com/i, 'whatsapp', 'WhatsApp Business'],
    [/olx\./i, 'olx', 'OLX'],
    [/mercadolivre|mercadolibre/i, 'mercadolivre', 'Mercado Livre'],
    [/ebay\./i, 'ebay', 'eBay'],
    [/aliexpress/i, 'aliexpress', 'AliExpress'],
    [/alibaba/i, 'alibaba', 'Alibaba'],
    [/pinterest/i, 'pinterest', 'Pinterest'],
    [/linkedin/i, 'linkedin', 'LinkedIn'],
  ];
  try {
    const host = new URL(url).hostname;
    for (const [re, platform, label] of rules) {
      if (re.test(host) || re.test(url)) return { platform, label };
    }
  } catch { /* */ }
  return { platform: 'other', label: 'Rede Social' };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function getMeta(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeHtml(m[1].trim());
    }
  }
  return undefined;
}

function extractAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  const copy = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = copy.exec(html)) !== null) {
    if (m[1]) out.push(decodeHtml(m[1].trim()));
  }
  return out;
}

function parsePrice(raw?: string | number | null, context?: 'title' | 'body'): number {
  if (raw == null) return 0;
  const s = String(raw);
  if (context === 'title' && /\d+\s*(?:gb|tb|mb|kg|ml|cm|mm)\b/i.test(s)) {
    return 0;
  }
  const patterns = [
    /(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(?:kz|kzs|aoa|€|\$|usd|eur)/i,
    /(?:preço|price|valor|amount)[:\s"']*(\d[\d\s.,]*)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) {
      const n = Number(m[1].replace(/\s/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  if (context !== 'title') {
    const n = Number(s.replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));
    if (Number.isFinite(n) && n > 0 && n >= 100) return n;
  }
  return 0;
}

function resolveAbsolute(base: string, maybeRelative?: string): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative.startsWith('http') ? maybeRelative : undefined;
  }
}

function parseJsonLd(html: string) {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch { /* */ }
  }
  return blocks;
}

function findProductInJson(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph'] as unknown[]) {
      const found = findProductInJson(item);
      if (found) return found;
    }
  }

  const type = String(obj['@type'] ?? '').toLowerCase();
  if (type.includes('product') || type.includes('offer')) return obj;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductInJson(item);
      if (found) return found;
    }
  }

  return null;
}

function collectImages(raw: unknown, base: string): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((item) => {
      if (typeof item === 'string') return resolveAbsolute(base, item);
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return resolveAbsolute(base, String(o.url ?? o.contentUrl ?? o['@id'] ?? ''));
      }
      return undefined;
    })
    .filter((u): u is string => !!u && u.startsWith('http'));
}

function parseSchemaProduct(html: string, base: string) {
  for (const block of parseJsonLd(html)) {
    const product = findProductInJson(block);
    if (!product) continue;
    const offers = product.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
    const offer = Array.isArray(offers) ? offers[0] : offers;
    const brandObj = product.brand as Record<string, unknown> | string | undefined;
    const seller = offer?.seller as Record<string, unknown> | undefined;
    return {
      title: String(product.name ?? product.title ?? ''),
      description: String(product.description ?? ''),
      price: parsePrice(offer?.price ?? product.price),
      currency: String(offer?.priceCurrency ?? product.priceCurrency ?? 'AOA'),
      brand: typeof brandObj === 'string' ? brandObj : String(brandObj?.name ?? ''),
      category: String(product.category ?? ''),
      condition: String(product.itemCondition ?? offer?.itemCondition ?? ''),
      images: collectImages(product.image ?? offer?.image, base),
      sellerName: seller ? String(seller.name ?? '') : undefined,
    };
  }
  return null;
}

function mineEmbeddedJson(html: string, base: string) {
  const title =
    html.match(/"marketplace_listing_title"\s*:\s*"([^"\\]+)"/)?.[1] ??
    html.match(/"listing_title"\s*:\s*"([^"\\]+)"/)?.[1] ??
    html.match(/"productName"\s*:\s*"([^"\\]+)"/)?.[1] ??
    html.match(/"name"\s*:\s*"([^"\\]{4,120})"/)?.[1];

  const description =
    html.match(/"description"\s*:\s*\{"text"\s*:\s*"([^"\\]+)"/)?.[1] ??
    html.match(/"listing_description"\s*:\s*"([^"\\]+)"/)?.[1] ??
    html.match(/"description"\s*:\s*"([^"\\]{8,500})"/)?.[1];

  const priceRaw =
    html.match(/"listing_price"\s*:\s*\{"amount"\s*:\s*"([^"]+)"/)?.[1] ??
    html.match(/"price"\s*:\s*"([^"]+)"/)?.[1] ??
    html.match(/"amount"\s*:\s*"([^"]+)"/)?.[1] ??
    html.match(/"formatted_price"\s*:\s*"([^"\\]+)"/)?.[1];

  const imageMatches = [
    ...html.matchAll(/"(?:uri|image|image_url|thumbnail)"\s*:\s*"(https:\\\/\\\/[^"\\]+)"/g),
    ...html.matchAll(/"(?:uri|image|image_url|thumbnail)"\s*:\s*"(https:\/\/[^"\\]+)"/g),
    ...html.matchAll(/"(https:\\\/\\\/scontent[^"\\]+\.(?:jpg|jpeg|png|webp)[^"\\]*)"/gi),
    ...html.matchAll(/"(https:\/\/[^"\\]*(?:scontent|fbcdn|olx|mercadolibre|mlstatic)[^"\\]*\.(?:jpg|jpeg|png|webp)[^"\\]*)"/gi),
  ];

  const images = [...new Set(
    imageMatches
      .map((m) => decodeHtml(m[1].replace(/\\\//g, '/')))
      .map((u) => resolveAbsolute(base, u))
      .filter((u): u is string => !!u),
  )];

  return {
    title: title ? decodeHtml(title) : undefined,
    description: description ? decodeHtml(description) : undefined,
    price: parsePrice(priceRaw),
    images,
  };
}

function extractImagesFromHtml(html: string, base: string): string[] {
  const fromOg = extractAll(html, /property=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi);
  const fromSrc = extractAll(html, /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
  const fromCdn = extractAll(html, /"(https?:\/\/[^"\\]*(?:scontent|fbcdn|olx|mercadolibre|mlstatic|aliexpress|ebayimg)[^"\\]*\.(?:jpg|jpeg|png|webp)[^"\\]*)"/gi);
  return [...new Set([...fromOg, ...fromSrc, ...fromCdn].map((u) => resolveAbsolute(base, u)).filter((u): u is string => !!u))];
}

function inferTitleFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] ?? 'Produto';
    return decodeURIComponent(slug)
      .replace(/[-_+]/g, ' ')
      .replace(/\.\w+$/, '')
      .replace(/\bID[\da-z]+\b/i, '')
      .trim();
  } catch {
    return 'Produto importado';
  }
}

function cleanText(s: string, max = 2000): string {
  return s
    .replace(/#\w+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function inferCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return undefined;
}

function inferBrand(title: string): string | undefined {
  const brands = ['Apple', 'Samsung', 'Toyota', 'Honda', 'Nike', 'Adidas', 'Sony', 'LG', 'Huawei', 'Xiaomi'];
  const lower = title.toLowerCase();
  return brands.find((b) => lower.includes(b.toLowerCase()));
}

function inferCondition(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/novo|new|selado/.test(lower)) return 'Novo';
  if (/usado|used|semi/.test(lower)) return 'Usado';
  return undefined;
}

function inferCity(text: string): string | undefined {
  const cities = ['Luanda', 'Benguela', 'Huambo', 'Talatona', 'Kilamba', 'Lubango', 'Cabinda'];
  const lower = text.toLowerCase();
  return cities.find((c) => lower.includes(c.toLowerCase()));
}

async function fetchMicrolink(url: string) {
  try {
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&video=false`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json() as {
      data?: {
        title?: string;
        description?: string;
        image?: { url?: string };
        price?: string | number;
        author?: string;
        publisher?: string;
      };
    };
    const data = json.data;
    if (!data) return null;
    const images = data.image?.url ? [data.image.url] : [];
    return {
      title: data.title,
      description: data.description,
      price: parsePrice(data.price),
      images,
      sellerName: data.author ?? data.publisher,
    };
  } catch {
    return null;
  }
}
async function fetchHtml(url: string, platform: string): Promise<string> {
  const agents = [
    platform === 'facebook' || platform === 'instagram' ? USER_AGENTS.facebook : null,
    USER_AGENTS.google,
    USER_AGENTS.chrome,
    USER_AGENTS.bot,
  ].filter(Boolean) as string[];

  for (const ua of agents) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt,en;q=0.9',
        },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length > 500) return text.slice(0, 500_000);
    } catch { /* try next */ }
  }
  return '';
}

function buildCompleteness(fields: unknown[]): number {
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export async function importFromUrl(url: string): Promise<ImportedPayload> {
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  const { platform, label } = detectPlatform(normalized);
  const html = await fetchHtml(normalized, platform);

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const ogTitle = getMeta(html, ['og:title', 'twitter:title']);
  const ogDescription = getMeta(html, ['og:description', 'twitter:description', 'description']);
  const ogImages = [
    getMeta(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']),
    ...extractAll(html, /property=["']og:image["'][^>]+content=["']([^"']+)["']/gi),
  ].filter(Boolean) as string[];

  const schema = html ? parseSchemaProduct(html, normalized) : null;
  const mined = html ? mineEmbeddedJson(html, normalized) : null;
  const htmlImages = html ? extractImagesFromHtml(html, normalized) : [];

  let title = cleanText(schema?.title || mined?.title || ogTitle || titleTag || inferTitleFromUrl(normalized), 200);
  let description = cleanText(schema?.description || mined?.description || ogDescription || '', 2000);
  let price = schema?.price || mined?.price || parsePrice(getMeta(html, ['og:price:amount', 'product:price:amount', 'product:price']));
  let category = schema?.category || undefined;
  let brand = schema?.brand || undefined;
  let condition = schema?.condition || undefined;
  let city = inferCity(`${title} ${description}`);
  const country = 'Angola';

  if (!price) price = parsePrice(title, 'title');
  if (!price && description) price = parsePrice(description, 'body');
  if (!price && html) {
    const priceInHtml = html.match(/(?:preço|price|valor)[^0-9]{0,12}(\d[\d\s.,]{2,})/i)?.[1];
    if (priceInHtml) price = parsePrice(priceInHtml, 'body');
  }

  if (!category) category = inferCategory(`${title} ${description}`);
  if (!brand) brand = inferBrand(title);
  if (!condition && description) condition = inferCondition(description);
  if (!city) city = 'Luanda';
  if (!description && title) description = `Produto importado de ${label}. ${title}.`;

  let images = [...new Set([
    ...(schema?.images ?? []),
    ...(mined?.images ?? []),
    ...ogImages.map((u) => resolveAbsolute(normalized, u)).filter((u): u is string => !!u),
    ...htmlImages,
  ])].slice(0, 8);

  let sellerName = schema?.sellerName ?? getMeta(html, ['og:site_name']);
  let importSource = html ? 'html' : 'url-fallback';

  if (images.length === 0 || !price || !description || title === inferTitleFromUrl(normalized)) {
    const preview = await fetchMicrolink(normalized);
    if (preview) {
      importSource = 'microlink';
      if (preview.title) title = cleanText(preview.title, 200);
      if (preview.description) description = cleanText(preview.description, 2000);
      if (preview.price) price = preview.price;
      if (preview.images.length) images = [...new Set([...images, ...preview.images])].slice(0, 8);
      if (preview.sellerName) sellerName = preview.sellerName;
    }
  }

  const completeness = buildCompleteness([title, description, price > 0, category, images.length > 0, city, country]);

  return {
    platform,
    platformLabel: label,
    originalUrl: normalized,
    title: title || 'Produto importado',
    description,
    price,
    currency: schema?.currency ?? 'AOA',
    category: category || undefined,
    condition: condition || undefined,
    brand: brand || undefined,
    city,
    country,
    images,
    videos: [],
    sellerName,
    metadata: {
      platformLabel: label,
      completeness,
      aiEnriched: true,
      importSource,
    },
  };
}
