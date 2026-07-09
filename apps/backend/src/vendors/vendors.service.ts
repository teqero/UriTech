import { Injectable } from '@nestjs/common';
import type { MenuItem } from '@uritech/shared';

export interface VendorEntity {
  id: string;
  userId: string;
  storeName: string;
  storeAddress: string;
  rating: number;
  isOpen: boolean;
  categories: string[];
  image?: string;
  totalOrders: number;
}

export type CreateVendorInput = Omit<VendorEntity, 'id' | 'rating' | 'totalOrders' | 'image'>;

@Injectable()
export class VendorsService {
  private vendors: VendorEntity[] = [
    {
      id: '1',
      userId: '3',
      storeName: 'Warung Nasi Goreng',
      storeAddress: 'Jl. Thamrin No. 5, Jakarta',
      rating: 4.8,
      isOpen: true,
      categories: ['Indonesian', 'Rice'],
      totalOrders: 342,
    },
    {
      id: '2',
      userId: '4',
      storeName: 'Burger King',
      storeAddress: 'Mall Grand Indonesia, Jakarta',
      rating: 4.5,
      isOpen: true,
      categories: ['Fast Food', 'Burgers'],
      totalOrders: 567,
    },
  ];

  private menuItems: MenuItem[] = [
    {
      id: '1',
      vendorId: '1',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng com ovo, frango e legumes',
      price: 25.0,
      category: 'Pratos Principais',
      isAvailable: true,
    },
    {
      id: '2',
      vendorId: '1',
      name: 'Es Teh Manis',
      description: 'Chá gelado tradicional',
      price: 8.0,
      category: 'Bebidas',
      isAvailable: true,
    },
    {
      id: '3',
      vendorId: '2',
      name: 'Whopper',
      description: 'Hambúrguer clássico com batata',
      price: 32.0,
      category: 'Burgers',
      isAvailable: true,
    },
  ];

  findAll() {
    return this.vendors;
  }

  findById(id: string) {
    return this.vendors.find((v) => v.id === id);
  }

  getMenu(vendorId: string) {
    return this.menuItems.filter((m) => m.vendorId === vendorId);
  }

  toggleOpen(id: string) {
    const vendor = this.vendors.find((v) => v.id === id);
    if (!vendor) return null;
    vendor.isOpen = !vendor.isOpen;
    return vendor;
  }

  create(data: CreateVendorInput) {
    const vendor: VendorEntity = {
      ...data,
      id: String(this.vendors.length + 1),
      rating: 5,
      totalOrders: 0,
    };
    this.vendors.push(vendor);
    return vendor;
  }
}
