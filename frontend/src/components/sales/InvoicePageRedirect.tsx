'use client';

import { useLayoutEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function InvoicePageRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'invoices');
    const query = params.toString();
    router.replace(query ? `/sales/invoice-dashboard?${query}` : '/sales/invoice-dashboard?tab=invoices');
  }, [pathname, router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting
    </div>
  );
}
