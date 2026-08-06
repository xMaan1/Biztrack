"use client";

import { Input } from "@/src/components/ui/input";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import type { InvoiceFormTotals } from "@/src/types/sales/invoiceForm";
import { COMMERCE_INPUT_CLS } from "../commerce-invoice/constants";
import { InlineField } from "../commerce-invoice/InlineField";

type InvoiceFormTotalsSummaryProps = {
  totals: InvoiceFormTotals;
};

export function InvoiceFormTotalsSummary({
  totals,
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
          <InlineField label="Labour Cost:">
            <Input
              readOnly
              value={formatCurrency(totals.labourCost)}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5" />

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
