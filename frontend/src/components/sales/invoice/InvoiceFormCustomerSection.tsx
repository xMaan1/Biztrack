'use client';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { CustomerSearch } from '@/src/components/ui/customer-search';
import { User, UserPlus } from 'lucide-react';
import type { Customer } from '@/src/services/CustomerService';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';

type InvoiceFormCustomerSectionProps = {
  mode: InvoiceFormMode;
  selectedCustomer: Customer | null;
  customerError?: string;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewCustomer: () => void;
};

export function InvoiceFormCustomerSection({
  mode,
  selectedCustomer,
  customerError,
  onCustomerSelect,
  onNewCustomer,
}: InvoiceFormCustomerSectionProps) {
  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-visible">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <CustomerSearch
              value={selectedCustomer}
              onSelect={onCustomerSelect}
              placeholder="Search for existing customers..."
              label="Select Customer"
              required
              error={customerError}
            />
          </div>
          {mode !== 'view' && (
            <Button type="button" variant="outline" className="shrink-0" onClick={onNewCustomer}>
              <UserPlus className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
