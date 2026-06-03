'use client';

import { Card, CardContent } from '@/src/components/ui/card';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import type { InvoiceCreate } from '@/src/models/sales';
import type { InvoiceFormTotals } from '@/src/types/sales/invoiceForm';

type InvoiceFormTotalsSummaryProps = {
  formData: InvoiceCreate;
  totals: InvoiceFormTotals;
};

export function InvoiceFormTotalsSummary({ formData, totals }: InvoiceFormTotalsSummaryProps) {
  const { formatCurrency } = useCurrency();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({formData.discount}%):</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({formData.taxRate}%):</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="border-t pt-2 text-lg font-bold">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
