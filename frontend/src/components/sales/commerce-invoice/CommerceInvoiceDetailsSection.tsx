'use client';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { Customer } from '@/src/services/CustomerService';
import type { InvoiceCreate } from '@/src/models/sales';
import { getCustomerDisplayName } from '@/src/utils/customerUtils';
import { COMMERCE_INPUT_CLS } from './constants';
import { InlineField } from './InlineField';

type CommerceInvoiceDetailsSectionProps = {
  formData: InvoiceCreate;
  errors: Record<string, string>;
  selectedCustomer: Customer | null;
  customerSearch: string;
  customerOptions: Customer[];
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSearchChange: (value: string) => void;
  onCustomerPick: (customerId: string) => void;
  onOrderTimeChange: (value: string) => void;
  onNewCustomer?: () => void;
};

export function CommerceInvoiceDetailsSection({
  formData,
  errors,
  selectedCustomer,
  customerSearch,
  customerOptions,
  onInputChange,
  onCustomerSearchChange,
  onCustomerPick,
  onOrderTimeChange,
  onNewCustomer,
}: CommerceInvoiceDetailsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 pb-3 pt-2">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Bill No:">
            <Input
              id="orderNumber"
              value={formData.orderNumber || ''}
              onChange={(e) => onInputChange('orderNumber', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Bill Type:" required>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => onInputChange('paymentTerms', value)}
            >
              <SelectTrigger className={`${COMMERCE_INPUT_CLS} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Due Payments">Due Payments</SelectItem>
              </SelectContent>
            </Select>
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Date & Time:">
            <Input
              id="orderTime"
              type="datetime-local"
              value={formData.orderTime || ''}
              onChange={(e) => onOrderTimeChange(e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Due Date:" labelClassName="text-destructive" required>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => onInputChange('dueDate', e.target.value)}
              className={`${COMMERCE_INPUT_CLS} ${errors.dueDate ? 'border-destructive' : ''}`}
            />
          </InlineField>
          {errors.dueDate && (
            <p className="pl-[116px] text-xs text-destructive">{errors.dueDate}</p>
          )}
          {errors.issueDate && (
            <p className="pl-[116px] text-xs text-destructive">{errors.issueDate}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <InlineField label="Description:">
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => onInputChange('notes', e.target.value)}
              placeholder="Enter Description"
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <div className="flex min-h-[34px] items-start gap-2">
            <span className="w-[108px] shrink-0 pt-1.5 text-right text-sm font-medium text-muted-foreground">
              Customer Name:
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => onCustomerSearchChange(e.target.value)}
                  placeholder="Search Customer"
                  className={`${COMMERCE_INPUT_CLS} w-[120px] shrink-0`}
                />
                <Select value={selectedCustomer?.id || ''} onValueChange={onCustomerPick}>
                  <SelectTrigger
                    className={`${COMMERCE_INPUT_CLS} min-w-0 flex-1 ${errors.customer ? 'border-destructive' : ''}`}
                  >
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCustomer &&
                      !customerOptions.some((c) => c.id === selectedCustomer.id) && (
                        <SelectItem value={selectedCustomer.id}>
                          {getCustomerDisplayName(selectedCustomer)}
                        </SelectItem>
                      )}
                    {customerOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCustomerDisplayName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onNewCustomer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-2 text-xs"
                    onClick={onNewCustomer}
                  >
                    +
                  </Button>
                )}
              </div>
              {errors.customer && (
                <p className="text-xs text-destructive">{errors.customer}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
