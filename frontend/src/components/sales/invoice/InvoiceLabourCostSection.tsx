'use client';

import { Input } from '@/src/components/ui/input';
import type { InvoiceCreate } from '@/src/models/sales';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';
import { COMMERCE_INPUT_CLS } from '../commerce-invoice/constants';
import { InlineField } from '../commerce-invoice/InlineField';

type InvoiceLabourCostSectionProps = {
  mode: InvoiceFormMode;
  value?: number;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceLabourCostSection({
  mode,
  value,
  onInputChange,
}: InvoiceLabourCostSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2">
      <InlineField label="Labour Cost:">
        <Input
          id="labourCost"
          type="number"
          step="0.01"
          min="0"
          disabled={mode === 'view'}
          value={value ?? 0}
          onChange={(e) => onInputChange('labourCost', parseFloat(e.target.value) || 0)}
          className={COMMERCE_INPUT_CLS}
        />
      </InlineField>
    </section>
  );
}
