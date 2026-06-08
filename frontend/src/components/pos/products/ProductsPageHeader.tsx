'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

type ProductsPageHeaderProps = {
  onAddProduct: () => void;
};

export function ProductsPageHeader({ onAddProduct }: ProductsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog and inventory</p>
      </div>
      <Button onClick={onAddProduct}>
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </Button>
    </div>
  );
}
