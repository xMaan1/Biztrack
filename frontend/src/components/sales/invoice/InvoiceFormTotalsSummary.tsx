'use client';

import { Input } from '@/src/components/ui/input';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import type { InvoiceCreate } from '@/src/models/sales';
import type { InvoiceFormTotals } from '@/src/types/sales/invoiceForm';
import { COMMERCE_INPUT_CLS } from '../commerce-invoice/constants';
import { InlineField } from '../commerce-invoice/InlineField';

type InvoiceFormTotalsSummaryProps = {
  formData: InvoiceCreate;
  totals: InvoiceFormTotals;
  showWorkshopTotals?: boolean;
};

export function InvoiceFormTotalsSummary({
  formData,
  totals,
  showWorkshopTotals = false,
}: InvoiceFormTotalsSummaryProps) {
  const { formatCurrency } = useCurrency();

  return (
    <section className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Subtotal:">
            <Input
              readOnly
              value={formatCurrency(totals.subtotal)}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Discount %:">
            <Input
              readOnly
              value={`${formData.discount}% (−${formatCurrency(totals.discount)})`}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Tax %:">
            <Input
              readOnly
              value={`${formData.taxRate}% (${formatCurrency(totals.taxAmount)})`}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          {showWorkshopTotals && (
            <>
              <InlineField label="Labour Total:">
                <Input
                  readOnly
                  value={formatCurrency(formData.labourTotal || 0)}
                  className={`${COMMERCE_INPUT_CLS} bg-background`}
                />
              </InlineField>
              <InlineField label="Parts Total:">
                <Input
                  readOnly
                  value={formatCurrency(formData.partsTotal || 0)}
                  className={`${COMMERCE_INPUT_CLS} bg-background`}
                />
              </InlineField>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <InlineField label="Total Amount:">
            <Input
              readOnly
              value={formatCurrency(totals.total)}
              className={`${COMMERCE_INPUT_CLS} bg-background font-semibold`}
            />
          </InlineField>
        </div>
      </div>
    </section>
  );
}
