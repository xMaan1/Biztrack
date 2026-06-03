'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Building } from 'lucide-react';
import type { InvoiceCreate } from '@/src/models/sales';
import type { InvoiceFormErrors } from '@/src/types/sales/invoiceForm';

type InvoiceFormDetailsSectionProps = {
  formData: InvoiceCreate;
  errors: InvoiceFormErrors;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceFormDetailsSection({
  formData,
  errors,
  onInputChange,
}: InvoiceFormDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Invoice Details
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="issueDate">Issue Date *</Label>
          <Input
            id="issueDate"
            type="date"
            value={formData.issueDate}
            onChange={(e) => onInputChange('issueDate', e.target.value)}
            className={errors.issueDate ? 'border-red-500' : ''}
          />
          {errors.issueDate && <p className="mt-1 text-sm text-red-500">{errors.issueDate}</p>}
        </div>
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => onInputChange('dueDate', e.target.value)}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
        </div>
        <div>
          <Label htmlFor="orderNumber">Order Number (Optional)</Label>
          <Input
            id="orderNumber"
            value={formData.orderNumber}
            onChange={(e) => onInputChange('orderNumber', e.target.value)}
            placeholder="Enter order number"
          />
        </div>
        <div>
          <Label htmlFor="orderTime">Order Time (Optional)</Label>
          <Input
            id="orderTime"
            type="datetime-local"
            value={formData.orderTime}
            onChange={(e) => onInputChange('orderTime', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Select
            value={formData.paymentTerms}
            onValueChange={(value) => onInputChange('paymentTerms', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Credit">Credit</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Due Payments">Due Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => onInputChange('currency', value)}>
            <SelectTrigger>
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
        </div>
        <div>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.taxRate}
            onChange={(e) => onInputChange('taxRate', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) => onInputChange('discount', parseFloat(e.target.value) || 0)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
