'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import type { Product } from '@/src/models/pos';
import type { Supplier } from '@/src/models/hrm/supplier';
import type { ProductFormData } from './types';
import { ProductFormFields } from './ProductFormFields';

type ProductFormDialogProps = {
  open: boolean;
  editingProduct: Product | null;
  formData: ProductFormData;
  categories: string[];
  suppliers: Supplier[];
  onOpenChange: (open: boolean) => void;
  onFormChange: (patch: Partial<ProductFormData>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAddCategoryClick: () => void;
  onAddVendorClick: () => void;
};

export function ProductFormDialog({
  open,
  editingProduct,
  formData,
  categories,
  suppliers,
  onOpenChange,
  onFormChange,
  onSubmit,
  onAddCategoryClick,
  onAddVendorClick,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {editingProduct
              ? 'Update the product information below.'
              : 'Fill in the product details to add it to your catalog.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <ProductFormFields
            formData={formData}
            categories={categories}
            suppliers={suppliers}
            onChange={onFormChange}
            onAddCategoryClick={onAddCategoryClick}
            onAddVendorClick={onAddVendorClick}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingProduct ? 'Update Product' : 'Add Product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
