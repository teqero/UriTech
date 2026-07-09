import { Injectable } from '@nestjs/common';
import {
  ON_DEMAND_SERVICES,
  STORE_DELIVERY_CATEGORIES,
  type OnDemandCatalogItem,
  type StoreCategoryItem,
} from '@uritech/shared';

@Injectable()
export class CatalogService {
  private onDemand: OnDemandCatalogItem[] = ON_DEMAND_SERVICES.map((s) => ({ ...s }));
  private storeCategories: StoreCategoryItem[] = STORE_DELIVERY_CATEGORIES.map((c) => ({ ...c }));

  getOnDemand(): OnDemandCatalogItem[] {
    return this.onDemand;
  }

  getStoreCategories(): StoreCategoryItem[] {
    return this.storeCategories;
  }

  toggleOnDemand(id: string): OnDemandCatalogItem | null {
    const item = this.onDemand.find((s) => s.id === id);
    if (!item) return null;
    item.enabled = !item.enabled;
    return item;
  }

  toggleStoreCategory(id: string): StoreCategoryItem | null {
    const item = this.storeCategories.find((c) => c.id === id);
    if (!item) return null;
    item.enabled = !item.enabled;
    return item;
  }

  updateOnDemand(id: string, data: Partial<Pick<OnDemandCatalogItem, 'priceFrom' | 'enabled'>>): OnDemandCatalogItem | null {
    const item = this.onDemand.find((s) => s.id === id);
    if (!item) return null;
    if (data.priceFrom !== undefined) item.priceFrom = data.priceFrom;
    if (data.enabled !== undefined) item.enabled = data.enabled;
    return item;
  }
}
