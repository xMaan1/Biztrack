'use client';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { InvoiceItemCreate } from '@/src/models/sales';
import type { Product } from '@/src/models/pos';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { lineItemTotal } from '@/src/utils/sales/invoiceFormUtils';
import type { InvoiceFormErrors } from '@/src/types/sales/invoiceForm';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';
import { COMMERCE_INPUT_CLS } from '../commerce-invoice/constants';
import { InlineField } from '../commerce-invoice/InlineField';

type InvoiceFormItemsSectionProps = {
  mode: InvoiceFormMode;
  loading: boolean;
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
  mode,
  loading,
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
    <div className="flex w-full min-w-0 flex-col gap-2">
      <section className="rounded-lg border border-border bg-card px-3 py-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-1.5">
            <InlineField label="Product:" required>
              <Select
                value={newItem.productId || ''}
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
                <SelectTrigger
                  className={`${COMMERCE_INPUT_CLS} w-full ${errors.newItemProduct ? 'border-destructive' : ''}`}
                >
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
            </InlineField>
            {errors.newItemProduct && (
              <p className="pl-[116px] text-xs text-destructive">{errors.newItemProduct}</p>
            )}
            <InlineField label="Description:" required>
              <Input
                id="description"
                value={newItem.description}
                onChange={(e) => {
                  patchNewItem({ description: e.target.value });
                  if (errors.newItemDescription) clearNewItemErrors();
                }}
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemDescription ? 'border-destructive' : ''}`}
              />
            </InlineField>
            {errors.newItemDescription && (
              <p className="pl-[116px] text-xs text-destructive">{errors.newItemDescription}</p>
            )}
            <InlineField label="Discount %:">
              <Input
                id="itemDiscount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newItem.discount}
                onChange={(e) => patchNewItem({ discount: parseFloat(e.target.value) || 0 })}
                className={COMMERCE_INPUT_CLS}
              />
            </InlineField>
          </div>

          <div className="space-y-1.5">
            <InlineField label="Quantity:" required>
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
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemQuantity ? 'border-destructive' : ''}`}
              />
            </InlineField>
            {errors.newItemQuantity && (
              <p className="pl-[116px] text-xs text-destructive">{errors.newItemQuantity}</p>
            )}
            <InlineField label="Unit Price:" required>
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
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemUnitPrice ? 'border-destructive' : ''}`}
              />
            </InlineField>
            {errors.newItemUnitPrice && (
              <p className="pl-[116px] text-xs text-destructive">{errors.newItemUnitPrice}</p>
            )}
            <InlineField label="Line Total:">
              <Input
                readOnly
                value={formatCurrency(lineItemTotal(newItem))}
                className={`${COMMERCE_INPUT_CLS} bg-muted font-medium`}
              />
            </InlineField>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-[300px] lg:w-[280px]">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={onAddItem}
            >
              Add
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              disabled={loading || mode === 'view'}
              className="h-9 text-xs font-semibold"
            >
              {loading
                ? 'Saving...'
                : mode === 'create'
                  ? 'Generate Invoice'
                  : 'Update Invoice'}
            </Button>
          </div>
        </div>
      </section>

      {(items.length > 0 || errors.items) && (
        <section className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
          {errors.items && (
            <p className="bg-destructive/10 px-3 py-1.5 text-sm text-destructive">{errors.items}</p>
          )}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-0 border-collapse text-sm table-fixed md:min-w-[640px] lg:min-w-0 lg:table-auto">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                      S No
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                      Description
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                      Qty
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                      Price
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                      Discount %
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                      Total
                    </th>
                    <th className="border border-primary/80 px-2 py-1.5 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={`item-${item.productId || index}-${index}`}
                      className={`bg-card ${errors[`item_${index}_productId`] ? 'outline outline-1 outline-destructive' : ''}`}
                    >
                      <td className="border border-border px-2 py-1">{index + 1}</td>
                      <td className="border border-border px-2 py-1">
                        <div className="font-medium">{item.description}</div>
                        {item.productId && (
                          <div className="text-xs text-muted-foreground">
                            Product ID: {item.productId}
                          </div>
                        )}
                      </td>
                      <td className="border border-border px-2 py-1 text-right">{item.quantity}</td>
                      <td className="border border-border px-2 py-1 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="border border-border px-2 py-1 text-right">{item.discount}%</td>
                      <td className="border border-border px-2 py-1 text-right font-medium">
                        {formatCurrency(lineItemTotal(item))}
                      </td>
                      <td className="border border-border px-2 py-1 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveItem(index)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
