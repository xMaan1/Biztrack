"use client";

import { Input } from "@/src/components/ui/input";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import type { InvoiceCreate } from "@/src/models/sales";
import type {
  InvoiceFormMode,
  InvoiceFormTotals,
} from "@/src/types/sales/invoiceForm";
import { COMMERCE_INPUT_CLS } from "../commerce-invoice/constants";
import { InlineField } from "../commerce-invoice/InlineField";

type InvoiceFormTotalsSummaryProps = {
  mode: InvoiceFormMode;
  totals: InvoiceFormTotals;
  labourCost?: number;
  onLabourCostChange: (
    field: keyof InvoiceCreate,
    value: string | number,
  ) => void;
};

export function InvoiceFormTotalsSummary({
  mode,
  totals,
  labourCost,
  onLabourCostChange,
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
          {totals.discountAmount > 0 && (
            <InlineField label="Total Discount:">
              <Input
                readOnly
                value={formatCurrency(-totals.discountAmount)}
                className={`${COMMERCE_INPUT_CLS} bg-background text-destructive`}
              />
            </InlineField>
          )}
          <InlineField label="Labour Cost:">
            <Input
              id="labourCost"
              type="number"
              step="0.01"
              min="0"
              disabled={mode === "view"}
              value={labourCost ?? 0}
              onChange={(e) =>
                onLabourCostChange("labourCost", parseFloat(e.target.value) || 0)
              }
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
