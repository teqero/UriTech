'use client';

import { useEffect, useState } from 'react';
import { applyBrandTheme, DEFAULT_WHITE_LABEL, type WhiteLabelConfig } from '@uritech/shared';
import { settingsApi } from '@/lib/api';

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<WhiteLabelConfig>(DEFAULT_WHITE_LABEL);

  useEffect(() => {
    settingsApi.getBrand()
      .then((data) => {
        setBrand(data);
        applyBrandTheme(data);
        if (data.appName) document.title = `${data.appName} Admin`;
      })
      .catch(() => applyBrandTheme(DEFAULT_WHITE_LABEL));
  }, []);

  return (
    <>
      {(brand.faviconUrl || brand.logoUrl) && (
        <link rel="icon" href={brand.faviconUrl || brand.logoUrl} />
      )}
      {children}
    </>
  );
}
