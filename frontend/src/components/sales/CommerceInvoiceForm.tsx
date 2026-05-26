'use client';

import React, { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CustomerSearch } from '../ui/customer-search';
import { Customer } from '../../services/CustomerService';
import { Product } from '../../models/pos';
import { InvoiceCreate, InvoiceItemCreate } from '../../models/sales';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Plus, Trash2, RotateCcw, UserPlus } from 'lucide-react';

export interface CommerceInvoiceTotals {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
}

export interface CommerceInvoiceFormProps {
  mode: 'create' | 'edit';
  formData: InvoiceCreate;
  errors: Record<string, string>;
  items: InvoiceItemCreate[];
  newItem: InvoiceItemCreate;
  products: Product[];
  selectedCustomer: Customer | null;
  totals: CommerceInvoiceTotals;
  loading: boolean;
  error?: string | null;
  createInstallmentPlan: boolean;
  installmentCount: number;
  installmentFrequency: string;
  installmentFirstDueDate: string;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onNewItemChange: (item: InvoiceItemCreate) => void;
  onProductSelect: (productId: string) => void;
  onAddItem: () => void;
  onAddExtraItem: () => void;
  onRemoveItem: (index: number) => void;
  onClearInvoice: () => void;
  onCancel: () => void;
  onNewCustomer?: () => void;
  setCreateInstallmentPlan: (value: boolean) => void;
  setInstallmentCount: (value: number) => void;
  setInstallmentFrequency: (value: string) => void;
  setInstallmentFirstDueDate: (value: string) => void;
  clearFieldError: (key: string) => void;
}

function lineGross(item: InvoiceItemCreate): number {
  return item.quantity * item.unitPrice;
}

function lineNet(item: InvoiceItemCreate): number {
  return lineGross(item) * (1 - item.discount / 100);
}

export function CommerceInvoiceForm({
  mode,
  formData,
  errors,
  items,
  newItem,
  products,
  selectedCustomer,
  totals,
  loading,
  error,
  createInstallmentPlan,
  installmentCount,
  installmentFrequency,
  installmentFirstDueDate,
  onInputChange,
  onCustomerSelect,
  onNewItemChange,
  onProductSelect,
  onAddItem,
  onAddExtraItem,
  onRemoveItem,
  onClearInvoice,
  onCancel,
  onNewCustomer,
  setCreateInstallmentPlan,
  setInstallmentCount,
  setInstallmentFrequency,
  setInstallmentFirstDueDate,
  clearFieldError,
}: CommerceInvoiceFormProps) {
  const { formatCurrency } = useCurrency();
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    );
  }, [products, productSearch]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const productUnit = (productId?: string) => {
    if (!productId) return '—';
    const p = products.find((x) => x.id === productId);
    return p?.unitOfMeasure || '—';
  };

  const updateNewItem = (patch: Partial<InvoiceItemCreate>) => {
    onNewItemChange({ ...newItem, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {mode === 'create' ? 'New Invoice' : 'Edit Invoice'}
        </h2>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onClearInvoice}
          className="shrink-0"
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Clear Invoice
        </Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Bill No</Label>
            <Input
              id="orderNumber"
              value={formData.orderNumber || ''}
              onChange={(e) => onInputChange('orderNumber', e.target.value)}
              placeholder="Bill number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Bill Type</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => onInputChange('paymentTerms', value)}
            >
              <SelectTrigger id="paymentTerms">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Due Payments">Due Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Description</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => onInputChange('notes', e.target.value)}
              placeholder="Invoice description"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Invoice Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => onInputChange('issueDate', e.target.value)}
              className={errors.issueDate ? 'border-red-500' : ''}
            />
            {errors.issueDate && (
              <p className="text-xs text-red-500">{errors.issueDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderTime">Date &amp; Time</Label>
            <Input
              id="orderTime"
              type="datetime-local"
              value={formData.orderTime || ''}
              onChange={(e) => onInputChange('orderTime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-red-600">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => onInputChange('dueDate', e.target.value)}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-500">{errors.dueDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => onInputChange('currency', value)}
            >
              <SelectTrigger id="currency">
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
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <CustomerSearch
              value={selectedCustomer}
              onSelect={onCustomerSelect}
              placeholder="Search by customer name..."
              label="Customer"
              required
              error={errors.customer}
            />
          </div>
          {onNewCustomer && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onNewCustomer}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              New Customer
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-3">
            <Label>Search (Name / Item code)</Label>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <Label>Product</Label>
            <Select
              value={newItem.productId || ''}
              onValueChange={(value) => {
                onProductSelect(value);
                clearFieldError('newItemProduct');
                clearFieldError('newItemDescription');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.length === 0 ? (
                  <SelectItem value="no-products" disabled>
                    No products found
                  </SelectItem>
                ) : (
                  filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.newItemProduct && (
              <p className="text-xs text-red-500">{errors.newItemProduct}</p>
            )}
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Item Name</Label>
            <Input
              value={newItem.description}
              onChange={(e) => {
                updateNewItem({ description: e.target.value });
                clearFieldError('newItemDescription');
              }}
              placeholder="Item name"
            />
            {errors.newItemDescription && (
              <p className="text-xs text-red-500">{errors.newItemDescription}</p>
            )}
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Quantity (Units / Packs)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={newItem.quantity}
              onChange={(e) => {
                updateNewItem({ quantity: parseFloat(e.target.value) || 0 });
                clearFieldError('newItemQuantity');
              }}
            />
            {errors.newItemQuantity && (
              <p className="text-xs text-red-500">{errors.newItemQuantity}</p>
            )}
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newItem.unitPrice}
              onChange={(e) => {
                updateNewItem({ unitPrice: parseFloat(e.target.value) || 0 });
                clearFieldError('newItemUnitPrice');
              }}
            />
            {errors.newItemUnitPrice && (
              <p className="text-xs text-red-500">{errors.newItemUnitPrice}</p>
            )}
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Discount %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newItem.discount}
              onChange={(e) =>
                updateNewItem({ discount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Button
            type="button"
            className="bg-sky-600 hover:bg-sky-700"
            onClick={onAddItem}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
          <Button
            type="button"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={onAddExtraItem}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Extra Item
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-teal-600 text-teal-700 hover:bg-teal-50"
            onClick={() => onInputChange('paymentTerms', 'Cash')}
          >
            Fully Paid
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 sm:col-span-2 lg:col-span-3"
          >
            {loading
              ? 'Saving...'
              : mode === 'create'
                ? 'Generate Invoice'
                : 'Update Invoice'}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200">
        {errors.items && (
          <p className="bg-red-50 px-3 py-2 text-sm text-red-600">{errors.items}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-2 text-left font-medium">S No</th>
                <th className="px-2 py-2 text-left font-medium">Name</th>
                <th className="px-2 py-2 text-right font-medium">Qty</th>
                <th className="px-2 py-2 text-left font-medium">Units</th>
                <th className="px-2 py-2 text-right font-medium">Rate</th>
                <th className="px-2 py-2 text-right font-medium">G Amount</th>
                <th className="px-2 py-2 text-right font-medium">Extra Discount %</th>
                <th className="px-2 py-2 text-right font-medium">Net Amount</th>
                <th className="px-2 py-2 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    No items added yet. Search a product and click Add.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr
                    key={`${item.productId}-${index}`}
                    className={`border-t border-slate-100 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="px-2 py-2">{index + 1}</td>
                    <td className="px-2 py-2 font-medium">{item.description}</td>
                    <td className="px-2 py-2 text-right">{item.quantity}</td>
                    <td className="px-2 py-2">{productUnit(item.productId)}</td>
                    <td className="px-2 py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {formatCurrency(lineGross(item))}
                    </td>
                    <td className="px-2 py-2 text-right">{item.discount}%</td>
                    <td className="px-2 py-2 text-right font-medium">
                      {formatCurrency(lineNet(item))}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-sky-200 bg-sky-50 p-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <div>
              <Label htmlFor="totalQty">Total Quantity</Label>
              <Input id="totalQty" readOnly value={totalQuantity} className="bg-white" />
            </div>
            <div>
              <Label htmlFor="taxRate">Total GST / Tax (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) =>
                  onInputChange('taxRate', parseFloat(e.target.value) || 0)
                }
                className="bg-white"
              />
            </div>
            <div>
              <Label>Bill Status</Label>
              <Input readOnly value="draft" className="bg-white capitalize" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Total Discount on Items</Label>
              <Input
                readOnly
                value={formatCurrency(
                  items.reduce(
                    (sum, item) =>
                      sum + lineGross(item) * (item.discount / 100),
                    0,
                  ),
                )}
                className="bg-white"
              />
            </div>
            <div>
              <Label htmlFor="discount">Flat Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) =>
                  onInputChange('discount', parseFloat(e.target.value) || 0)
                }
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Total Amount</Label>
              <Input
                readOnly
                value={formatCurrency(totals.total)}
                className="bg-white font-semibold"
              />
            </div>
            <div>
              <Label>Flat Discount Amount</Label>
              <Input
                readOnly
                value={formatCurrency(totals.discount)}
                className="bg-white"
              />
            </div>
            <div>
              <Label>Tax Amount</Label>
              <Input
                readOnly
                value={formatCurrency(totals.taxAmount)}
                className="bg-white"
              />
            </div>
            <div>
              <Label>Bill Balance</Label>
              <Input
                readOnly
                value={formatCurrency(totals.total)}
                className="bg-white font-semibold text-red-700"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="createInstallmentPlan"
            checked={createInstallmentPlan}
            onChange={(e) => setCreateInstallmentPlan(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="createInstallmentPlan">
            Create installment plan for this invoice
          </Label>
        </div>
        {createInstallmentPlan && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="installmentCount">Number of installments</Label>
              <Input
                id="installmentCount"
                type="number"
                min={1}
                max={60}
                value={installmentCount}
                onChange={(e) =>
                  setInstallmentCount(parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
            <div>
              <Label htmlFor="installmentFrequency">Frequency</Label>
              <Select
                value={installmentFrequency}
                onValueChange={setInstallmentFrequency}
              >
                <SelectTrigger id="installmentFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="installmentFirstDueDate">First due date</Label>
              <Input
                id="installmentFirstDueDate"
                type="date"
                value={installmentFirstDueDate}
                onChange={(e) => setInstallmentFirstDueDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      <div className="hidden">
        <Label htmlFor="terms">Terms</Label>
        <Textarea
          id="terms"
          value={formData.terms || ''}
          onChange={(e) => onInputChange('terms', e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
