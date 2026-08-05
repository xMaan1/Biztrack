'use client';

import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { InvoiceCreate } from '@/src/models/sales';
import type { InvoiceFormErrors } from '@/src/types/sales/invoiceForm';
import { COMMERCE_INPUT_CLS } from '../commerce-invoice/constants';
import { InlineField } from '../commerce-invoice/InlineField';
import { InvoiceFormCustomerSection } from './InvoiceFormCustomerSection';
import type { Customer } from '@/src/services/CustomerService';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';

type InvoiceFormDetailsSectionProps = {
  mode: InvoiceFormMode;
  formData: InvoiceCreate;
  errors: InvoiceFormErrors;
  selectedCustomer: Customer | null;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewCustomer: () => void;
};

export function InvoiceFormDetailsSection({
  mode,
  formData,
  errors,
  selectedCustomer,
  onInputChange,
  onCustomerSelect,
  onNewCustomer,
}: InvoiceFormDetailsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 pb-3 pt-2">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Issue Date:" required>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => onInputChange('issueDate', e.target.value)}
              className={`${COMMERCE_INPUT_CLS} ${errors.issueDate ? 'border-destructive' : ''}`}
            />
          </InlineField>
          {errors.issueDate && (
            <p className="pl-[116px] text-xs text-destructive">{errors.issueDate}</p>
          )}
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
          <InlineField label="Order Number:">
            <Input
              id="orderNumber"
              value={formData.orderNumber}
              onChange={(e) => onInputChange('orderNumber', e.target.value)}
              placeholder="Enter order number"
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Order Time:">
            <Input
              id="orderTime"
              type="datetime-local"
              value={formData.orderTime}
              onChange={(e) => onInputChange('orderTime', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Payment Terms:">
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => onInputChange('paymentTerms', value)}
            >
              <SelectTrigger className={`${COMMERCE_INPUT_CLS} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Due Payments">Due Payments</SelectItem>
              </SelectContent>
            </Select>
          </InlineField>
          <InlineField label="Currency:">
            <Select
              value={formData.currency}
              onValueChange={(value) => onInputChange('currency', value)}
            >
              <SelectTrigger className={`${COMMERCE_INPUT_CLS} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="PKR">PKR (Rs)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Tax Rate %:">
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) => onInputChange('taxRate', parseFloat(e.target.value) || 0)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Discount %:">
            <Input
              id="discount"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => onInputChange('discount', parseFloat(e.target.value) || 0)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Labour Cost:">
            <Input
              id="labourCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.labourCost}
              onChange={(e) => onInputChange('labourCost', parseFloat(e.target.value) || 0)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Notes:">
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => onInputChange('notes', e.target.value)}
              placeholder="Enter notes"
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>
      </div>

      <InvoiceFormCustomerSection
        mode={mode}
        selectedCustomer={selectedCustomer}
        customerError={errors.customer}
        onCustomerSelect={onCustomerSelect}
        onNewCustomer={onNewCustomer}
      />
    </section>
  );
}
