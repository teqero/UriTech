'use client';

import { useEffect } from 'react';
import { applyBrandTheme, DEFAULT_WHITE_LABEL } from '@uritech/shared';
import { API_BASE_URL } from '@uritech/shared';

export function BrandProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/brand`)
      .then((r) => r.json())
      .then((data) => applyBrandTheme(data))
      .catch(() => applyBrandTheme(DEFAULT_WHITE_LABEL));
  }, []);

  return <>{children}</>;
}
