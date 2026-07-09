import type { WhiteLabelConfig } from './types';
import { colors, typography } from './theme';
import {
  APP_NAME,
  APP_TAGLINE,
  CURRENCY_SYMBOL,
  DEFAULT_CITY,
  DEFAULT_COUNTRY,
} from './constants';

export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  appName: APP_NAME,
  tagline: APP_TAGLINE,
  primaryColor: colors.primary,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  secondaryColor: colors.secondary,
  fontFamily: typography.fontFamily.primary.split(',')[0].replace(/"/g, ''),
  defaultCity: DEFAULT_CITY,
  defaultCountry: DEFAULT_COUNTRY,
  currencySymbol: CURRENCY_SYMBOL,
};

export function applyBrandTheme(brand: WhiteLabelConfig, target?: HTMLElement) {
  if (typeof document === 'undefined') return;
  const el = target ?? document.documentElement;
  el.style.setProperty('--primary', brand.primaryColor);
  el.style.setProperty('--primary-dark', brand.primaryDark);
  el.style.setProperty('--primary-light', brand.primaryLight);
  el.style.setProperty('--secondary', brand.secondaryColor);
  if (brand.fontFamily) {
    el.style.setProperty('--font-family', brand.fontFamily);
    document.body.style.fontFamily = `${brand.fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
  }
}

export function brandToCssVars(brand: WhiteLabelConfig): Record<string, string> {
  return {
    '--primary': brand.primaryColor,
    '--primary-dark': brand.primaryDark,
    '--primary-light': brand.primaryLight,
    '--secondary': brand.secondaryColor,
  };
}

export function getCopyrightText(
  brand: Pick<WhiteLabelConfig, 'appName' | 'defaultCity' | 'defaultCountry'>,
  year = new Date().getFullYear(),
): string {
  return `© ${year} ${brand.appName} ${brand.defaultCountry}. Todos os direitos reservados. ${brand.defaultCity}, ${brand.defaultCountry}`;
}

const IMAGE_MIME = /^image\/(png|jpeg|jpg|gif|webp|svg\+xml|x-icon|vnd\.microsoft\.icon)$/;

export function readImageFile(
  file: File,
  maxBytes: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!IMAGE_MIME.test(file.type)) {
      reject(new Error('Formato inválido. Use PNG, JPG, GIF, WebP ou ICO.'));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`Ficheiro demasiado grande (máx. ${Math.round(maxBytes / 1024)} KB).`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}
