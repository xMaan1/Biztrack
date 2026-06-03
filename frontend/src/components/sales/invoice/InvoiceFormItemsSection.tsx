'use client';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import type { InvoiceItemCreate } from '@/src/models/sales';
import type { Product } from '@/src/models/pos';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { lineItemTotal } from '@/src/utils/sales/invoiceFormUtils';
import type { InvoiceFormErrors } from '@/src/types/sales/invoiceForm';

type InvoiceFormItemsSectionProps = {
  items: InvoiceItemCreate[];
  newItem: InvoiceItemCreate;
  products: Product[];
  errors: InvoiceFormErrors;
  onNewItemChange: (item: InvoiceItemCreate) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  clearNewItemErrors: () => void;
};

export function InvoiceFormItemsSection({
  items,
  newItem,
  products,
  errors,
  onNewItemChange,
  onAddItem,
  onRemoveItem,
  clearNewItemErrors,
}: InvoiceFormItemsSectionProps) {
  const { formatCurrency } = useCurrency();

  const patchNewItem = (partial: Partial<InvoiceItemCreate>) => {
    onNewItemChange({ ...newItem, ...partial });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Invoice Items
        </CardTitle>
        {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product *</Label>
            <Select
              value={newItem.productId}
              onValueChange={(value) => {
                const product = products.find((p) => p.id === value);
                patchNewItem({
                  productId: value,
                  description: product?.name || '',
                  unitPrice: product?.unitPrice || 0,
                });
                clearNewItemErrors();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="no-products" disabled>
                    No products available
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.newItemProduct && (
              <p className="text-sm text-red-500">{errors.newItemProduct}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={newItem.description}
              onChange={(e) => {
                patchNewItem({ description: e.target.value });
                if (errors.newItemDescription) clearNewItemErrors();
              }}
            />
            {errors.newItemDescription && (
              <p className="text-sm text-red-500">{errors.newItemDescription}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={newItem.quantity}
              onChange={(e) => {
                patchNewItem({ quantity: parseFloat(e.target.value) || 0 });
                if (errors.newItemQuantity) clearNewItemErrors();
              }}
            />
            {errors.newItemQuantity && (
              <p className="text-sm text-red-500">{errors.newItemQuantity}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price *</Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={newItem.unitPrice}
              onChange={(e) => {
                patchNewItem({ unitPrice: parseFloat(e.target.value) || 0 });
                if (errors.newItemUnitPrice) clearNewItemErrors();
              }}
            />
            {errors.newItemUnitPrice && (
              <p className="text-sm text-red-500">{errors.newItemUnitPrice}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemDiscount">Discount (%)</Label>
            <Input
              id="itemDiscount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newItem.discount}
              onChange={(e) => patchNewItem({ discount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <div className="rounded bg-gray-50 p-2 text-sm font-medium">
              {formatCurrency(lineItemTotal(newItem))}
            </div>
          </div>
          <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className={`grid grid-cols-12 items-center gap-2 rounded-lg border p-3 ${
              errors[`item_${index}_productId`] ? 'border-red-500' : ''
            }`}
          >
            <div className="col-span-3">
              <span className="font-medium">{item.description}</span>
              {item.productId && (
                <div className="text-sm text-gray-500">Product ID: {item.productId}</div>
              )}
            </div>
            <div className="col-span-2">Qty: {item.quantity}</div>
            <div className="col-span-2">Price: {formatCurrency(item.unitPrice)}</div>
            <div className="col-span-2">Discount: {item.discount}%</div>
            <div className="col-span-2 font-medium">{formatCurrency(lineItemTotal(item))}</div>
            <div className="col-span-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveItem(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
