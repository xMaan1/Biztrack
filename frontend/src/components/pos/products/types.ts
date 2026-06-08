import type { Product, UnitOfMeasure } from '@/src/models/pos';

export type ProductFormData = {
  name: string;
  sku: string;
  description: string;
  category: string;
  productType: string;
  packSize: number;
  brand: string;
  supplierId: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unitOfMeasure: UnitOfMeasure;
  barcode: string;
  expiryDate: string;
  batchNumber: string;
  serialNumber: string;
  mfgDate: string;
  dateOfPurchase: string;
  modelNo: string;
};

export type ProductFiltersState = {
  searchTerm: string;
  selectedCategory: string;
  showLowStock: boolean;
};
