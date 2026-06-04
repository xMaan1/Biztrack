'use client';

import { Input } from '@/src/components/ui/input';
import type { InvoiceCreate } from '@/src/models/sales';
import { COMMERCE_INPUT_CLS } from './constants';
import { InlineField } from './InlineField';
import type { CommerceInvoiceTotals } from './types';

type CommerceInvoiceTotalsSectionProps = {
  formData: InvoiceCreate;
  totals: CommerceInvoiceTotals;
  totalQuantity: number;
  totalItemDiscount: number;
  paidAmount: number;
  addBalanceToDiscount: boolean;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onPaidAmountChange: (value: number) => void;
  onAddBalanceToDiscountChange: (value: boolean) => void;
};

export function CommerceInvoiceTotalsSection({
  formData,
  totals,
  totalQuantity,
  totalItemDiscount,
  paidAmount,
  addBalanceToDiscount,
  onInputChange,
  onPaidAmountChange,
  onAddBalanceToDiscountChange,
}: CommerceInvoiceTotalsSectionProps) {
  const billBalance = Math.max(0, totals.total - paidAmount);

  return (
    <section className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Total Quantity:">
            <Input
              readOnly
              value={totalQuantity}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Total GST:">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) => onInputChange('taxRate', parseFloat(e.target.value) || 0)}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Bill Status:">
            <Input
              readOnly
              value={paidAmount >= totals.total && totals.total > 0 ? 'paid' : 'draft'}
              className={`${COMMERCE_INPUT_CLS} bg-background capitalize`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Total Discount on Items:">
            <Input
              readOnly
              value={Math.round(totalItemDiscount * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Flat Discount:">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => onInputChange('discount', parseFloat(e.target.value) || 0)}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <div className="flex min-h-[34px] items-center gap-2 pl-[116px]">
            <input
              type="checkbox"
              id="addBalanceToDiscount"
              checked={addBalanceToDiscount}
              onChange={(e) => onAddBalanceToDiscountChange(e.target.checked)}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <label htmlFor="addBalanceToDiscount" className="text-xs text-muted-foreground">
              Add remaining balance to Discount
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Total Amount:">
            <Input
              readOnly
              value={Math.round(totals.total * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background font-semibold`}
            />
          </InlineField>
          <InlineField label="Paid Amount:">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Bill Balance:">
            <Input
              readOnly
              value={Math.round(billBalance * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background font-semibold`}
            />
          </InlineField>
        </div>
      </div>
    </section>
  );
}
