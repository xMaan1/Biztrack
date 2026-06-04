'use client';

import type { Product } from '@/src/models/pos';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { formatUnitLabel } from '@/src/constants/unitOfMeasureOptions';

type CommerceInvoiceProductSearchTableProps = {
  products: Product[];
  onSelect: (product: Product) => void;
};

export function CommerceInvoiceProductSearchTable({
  products,
  onSelect,
}: CommerceInvoiceProductSearchTableProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="border border-border px-2 py-1 text-left font-semibold">Name</th>
            <th className="border border-border px-2 py-1 text-left font-semibold">SKU</th>
            <th className="border border-border px-2 py-1 text-left font-semibold">Barcode</th>
            <th className="border border-border px-2 py-1 text-right font-semibold">Rate</th>
            <th className="border border-border px-2 py-1 text-right font-semibold">Stock</th>
            <th className="border border-border px-2 py-1 text-left font-semibold">Units</th>
            <th className="border border-border px-2 py-1 text-left font-semibold">Category</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="border border-border px-2 py-2 text-center text-muted-foreground"
              >
                No products found
              </td>
            </tr>
          ) : (
            products.slice(0, 20).map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer bg-card hover:bg-accent"
                onClick={() => onSelect(p)}
              >
                <td className="border border-border px-2 py-1">{p.name}</td>
                <td className="border border-border px-2 py-1">{p.sku}</td>
                <td className="border border-border px-2 py-1">{p.barcode || '—'}</td>
                <td className="border border-border px-2 py-1 text-right">
                  {formatCurrency(p.unitPrice)}
                </td>
                <td className="border border-border px-2 py-1 text-right">{p.stockQuantity}</td>
                <td className="border border-border px-2 py-1">
                  {formatUnitLabel(p.unitOfMeasure) || '—'}
                </td>
                <td className="border border-border px-2 py-1 capitalize">{p.category || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
