'use client';

import { Suspense } from 'react';
import { InvoicePageRedirect } from '@/src/components/sales/InvoicePageRedirect';

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Redirecting
        </div>
      }
    >
      <InvoicePageRedirect />
    </Suspense>
  );
}
