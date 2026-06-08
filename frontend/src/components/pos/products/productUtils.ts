import type { Product, ProductCreate, UnitOfMeasure } from '@/src/models/pos';
import { UnitOfMeasure as UnitOfMeasureEnum } from '@/src/models/pos';
import type { ProductFiltersState, ProductFormData } from './types';

export function getDefaultDateOfPurchase(): string {
  return new Date().toISOString().split('T')[0];
}

export function emptyProductFormData(): ProductFormData {
  return {
    name: '',
    sku: '',
    description: '',
    category: 'other',
    productType: '',
    packSize: 1,
    brand: '',
    supplierId: '',
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    unitOfMeasure: UnitOfMeasureEnum.PIECE,
    barcode: '',
    expiryDate: '',
    batchNumber: '',
    serialNumber: '',
    mfgDate: '',
    dateOfPurchase: getDefaultDateOfPurchase(),
    modelNo: '',
  };
}

export function productToFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    category: product.category,
    productType: product.productType || '',
    packSize: product.packSize ?? 1,
    brand: product.brand || '',
    supplierId: product.supplierId || '',
    unitPrice: product.unitPrice,
    costPrice: product.costPrice,
    stockQuantity: product.stockQuantity,
    minStockLevel: product.minStockLevel,
    unitOfMeasure: product.unitOfMeasure || UnitOfMeasureEnum.PIECE,
    barcode: product.barcode || '',
    expiryDate: product.expiryDate || '',
    batchNumber: product.batchNumber || '',
    serialNumber: product.serialNumber || '',
    mfgDate: product.mfgDate || '',
    dateOfPurchase: product.dateOfPurchase || getDefaultDateOfPurchase(),
    modelNo: product.modelNo || '',
  };
}

export function formDataToPayload(formData: ProductFormData): ProductCreate {
  return {
    name: formData.name,
    sku: formData.sku,
    description: formData.description || undefined,
    category: formData.category,
    productType: formData.productType || undefined,
    packSize: formData.packSize || 1,
    brand: formData.brand || undefined,
    supplierId: formData.supplierId || undefined,
    unitPrice: formData.unitPrice,
    costPrice: formData.costPrice,
    stockQuantity: formData.stockQuantity,
    minStockLevel: formData.minStockLevel,
    unitOfMeasure: formData.unitOfMeasure,
    barcode: formData.barcode || undefined,
    expiryDate: formData.expiryDate || undefined,
    batchNumber: formData.batchNumber || undefined,
    serialNumber: formData.serialNumber || undefined,
    mfgDate: formData.mfgDate || undefined,
    dateOfPurchase: formData.dateOfPurchase || undefined,
    modelNo: formData.modelNo || undefined,
  };
}

export function filterProducts(
  products: Product[],
  { searchTerm, selectedCategory, showLowStock }: ProductFiltersState,
): Product[] {
  return products.filter((product) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      (product.barcode && product.barcode.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    const matchesLowStock =
      !showLowStock || product.stockQuantity <= product.minStockLevel;

    return matchesSearch && matchesCategory && matchesLowStock;
  });
}

export function formatProductDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US');
}

export function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

export function vendorCodeFromName(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return base || `VEN-${Date.now().toString(36).toUpperCase()}`;
}

export function profitMarginPercent(unitPrice: number, costPrice: number): string {
  if (!costPrice) return '0.0';
  return (((unitPrice - costPrice) / costPrice) * 100).toFixed(1);
}

export function defaultFilters(): ProductFiltersState {
  return {
    searchTerm: '',
    selectedCategory: 'all',
    showLowStock: false,
  };
}

export function unitLabel(unit?: UnitOfMeasure): string {
  return unit || UnitOfMeasureEnum.PIECE;
}
