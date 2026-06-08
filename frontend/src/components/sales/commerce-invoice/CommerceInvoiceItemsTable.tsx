'use client';

import { Button } from '@/src/components/ui/button';
import type { Product } from '@/src/models/pos';
import type { InvoiceItemCreate } from '@/src/models/sales';
import {
  formatSalePrice,
  itemToTableRow,
  PRODUCT_TABLE_COLUMNS,
  productToTableRow,
} from '@/src/utils/sales/commerceProductTableUtils';
import { Trash2 } from 'lucide-react';

type CommerceInvoiceItemsTableProps = {
  items: InvoiceItemCreate[];
  products: Product[];
  productSearch: string;
  searchResults: Product[];
  itemsError?: string;
  onRemoveItem: (index: number) => void;
  onPickProduct: (product: Product) => void;
};

function CatalogTableHeader({ showAction }: { showAction: boolean }) {
  return (
    <thead>
      <tr className="bg-primary text-primary-foreground">
        {PRODUCT_TABLE_COLUMNS.map((column) => (
          <th
            key={column}
            className={`border border-primary/80 px-2 py-1.5 font-semibold ${
              column === 'Sale Price' || column === 'Total Qty' ? 'text-right' : 'text-left'
            }`}
          >
            {column}
          </th>
        ))}
        {showAction && (
          <th className="border border-primary/80 px-2 py-1.5 text-center font-semibold">
            Action
          </th>
        )}
      </tr>
    </thead>
  );
}

function CatalogTableCells({
  row,
  className = '',
}: {
  row: ReturnType<typeof productToTableRow>;
  className?: string;
}) {
  return (
    <>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.code}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.name}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.type}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.pack}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.company}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.vendor}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.category}</td>
      <td className={`border border-border px-2 py-1 text-right ${className}`}>
        {formatSalePrice(row.salePrice)}
      </td>
      <td className={`border border-border px-2 py-1 text-right ${className}`}>{row.totalQty}</td>
      <td className={`border border-border px-2 py-1 ${className}`}>{row.totalUnits}</td>
    </>
  );
}

export function CommerceInvoiceItemsTable({
  items,
  products,
  productSearch,
  searchResults,
  itemsError,
  onRemoveItem,
  onPickProduct,
}: CommerceInvoiceItemsTableProps) {
  const isSearching = productSearch.trim().length > 0;
  const showTable = items.length > 0 || isSearching;

  if (!showTable) {
    if (!itemsError) return null;
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
        {itemsError}
      </p>
    );
  }

  const columnCount = PRODUCT_TABLE_COLUMNS.length + (items.length > 0 ? 1 : 0);

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
      {itemsError && (
        <p className="bg-destructive/10 px-3 py-1.5 text-sm text-destructive">{itemsError}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 border-collapse text-sm md:min-w-[960px]">
          <CatalogTableHeader showAction={items.length > 0} />
          <tbody>
            {isSearching &&
              (searchResults.length === 0 ? (
                <tr className="bg-muted/30">
                  <td
                    colSpan={columnCount}
                    className="border border-border px-3 py-2 text-center text-muted-foreground"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                searchResults.slice(0, 20).map((product, index) => {
                  const row = productToTableRow(product);
                  return (
                    <tr
                      key={`search-${product.id}`}
                      className={`cursor-pointer hover:bg-accent ${
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      }`}
                      onClick={() => onPickProduct(product)}
                    >
                      <CatalogTableCells row={row} />
                      {items.length > 0 && (
                        <td className="border border-border px-2 py-1 text-center text-muted-foreground">
                          —
                        </td>
                      )}
                    </tr>
                  );
                })
              ))}

            {items.map((item, index) => {
              const row = itemToTableRow(item, products);
              return (
                <tr
                  key={`item-${item.productId}-${index}`}
                  className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                >
                  <CatalogTableCells row={row} />
                  <td className="border border-border px-2 py-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
