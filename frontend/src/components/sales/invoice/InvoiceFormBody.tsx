'use client';

import type { Invoice } from '@/src/models/sales';
import type { UseInvoiceFormReturn } from '@/src/hooks/useInvoiceForm';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';
import { InvoiceViewContent } from './InvoiceViewContent';
import { WorkshopInvoiceForm } from './WorkshopInvoiceForm';

type InvoiceFormBodyProps = {
  mode: InvoiceFormMode;
  invoice?: Invoice | null;
  form: UseInvoiceFormReturn;
  error?: string | null;
};

export function InvoiceFormBody({ mode, invoice, form, error }: InvoiceFormBodyProps) {
  if (mode === 'view' && invoice) {
    return <InvoiceViewContent invoice={invoice} onClose={form.handleDismiss} />;
  }

  return <WorkshopInvoiceForm mode={mode} form={form} error={error} />;
}
