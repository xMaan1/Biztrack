'use client';

import { Card, CardContent } from '../ui/card';
import { InvoiceDialog, InstallmentPlanCreateOption } from './InvoiceDialog';
import { InvoiceCreate } from '../../models/sales';

type CreateInvoiceSectionProps = {
  onSubmit: (
    data: InvoiceCreate,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => void | Promise<void>;
  error?: string | null;
};

export function CreateInvoiceSection({ onSubmit, error }: CreateInvoiceSectionProps) {
  return (
    <Card className="overflow-hidden shadow-md">
      <CardContent className="p-0">
        <InvoiceDialog
          inline
          open
          onOpenChange={() => {}}
          mode="create"
          onSubmit={onSubmit}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
