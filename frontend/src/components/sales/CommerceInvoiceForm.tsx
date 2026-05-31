'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Customer } from '../../services/CustomerService';
import { Product } from '../../models/pos';
import { InvoiceCreate, InvoiceItemCreate } from '../../models/sales';
import { useCurrency } from '../../contexts/CurrencyContext';
import InvoiceService from '../../services/InvoiceService';
import { getCustomerDisplayName } from '@/src/utils/customerUtils';
import { Trash2, FileText } from 'lucide-react';
import { UnitOfMeasureSelect } from './UnitOfMeasureSelect';
import { formatUnitLabel } from '../../constants/unitOfMeasureOptions';

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
  onAddExtraItem: () => void | Promise<void>;
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

function InlineField({
  label,
  labelClassName = 'text-muted-foreground',
  required,
  children,
}: {
  label: string;
  labelClassName?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[34px] items-center gap-2">
      <span
        className={`w-[108px] shrink-0 text-right text-sm font-medium ${labelClassName}`}
      >
        {label}
        {required ? ' *' : ''}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const inputCls = 'h-8 rounded-md border-input bg-background text-sm shadow-none';

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
  onNewCustomer,
  setCreateInstallmentPlan,
  setInstallmentCount,
  setInstallmentFrequency,
  setInstallmentFirstDueDate,
  clearFieldError,
}: CommerceInvoiceFormProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [addBalanceToDiscount, setAddBalanceToDiscount] = useState(true);

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

  const totalItemDiscount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + lineGross(item) * (item.discount / 100),
        0,
      ),
    [items],
  );

  const billBalance = Math.max(0, totals.total - paidAmount);

  const resolveItemUnit = (item: InvoiceItemCreate) => {
    if (item.unit) return item.unit;
    if (item.productId) {
      const p = products.find((x) => x.id === item.productId);
      return p?.unitOfMeasure || '';
    }
    return '';
  };

  const updateNewItem = (patch: Partial<InvoiceItemCreate>) => {
    onNewItemChange({ ...newItem, ...patch });
  };

  useEffect(() => {
    const q = customerSearch.trim();
    if (q.length < 2) {
      setCustomerOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await InvoiceService.searchCustomers(q, 20);
        setCustomerOptions(results);
      } catch {
        setCustomerOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleOrderTimeChange = (value: string) => {
    onInputChange('orderTime', value);
    if (value) {
      onInputChange('issueDate', value.slice(0, 10));
    }
  };

  const pickProduct = (product: Product) => {
    onProductSelect(product.id);
    setProductSearch(product.name);
    clearFieldError('newItemProduct');
    clearFieldError('newItemDescription');
  };

  const handleCustomerPick = (customerId: string) => {
    const customer = customerOptions.find((c) => c.id === customerId);
    if (customer) {
      onCustomerSelect(customer);
      setCustomerSearch('');
    }
  };

  return (
    <div className="flex flex-col gap-2 text-foreground">
      <div className="flex items-center justify-between gap-3 pr-11">
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-none">
          <FileText className="h-5 w-5 text-primary" />
          {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
        </h2>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onClearInvoice}
          className="h-8 shrink-0 px-3 text-xs font-semibold"
        >
          Clear Invoice
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card px-3 pb-3 pt-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <InlineField label="Bill No:">
              <Input
                id="orderNumber"
                value={formData.orderNumber || ''}
                onChange={(e) => onInputChange('orderNumber', e.target.value)}
                className={inputCls}
              />
            </InlineField>
            <InlineField label="Bill Type:" required>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value) => onInputChange('paymentTerms', value)}
              >
                <SelectTrigger className={`${inputCls} w-full`}>
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
                onChange={(e) => handleOrderTimeChange(e.target.value)}
                className={inputCls}
              />
            </InlineField>
            <InlineField label="Due Date:" labelClassName="text-destructive" required>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => onInputChange('dueDate', e.target.value)}
                className={`${inputCls} ${errors.dueDate ? 'border-destructive' : ''}`}
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
                className={inputCls}
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
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search Customer"
                    className={`${inputCls} w-[120px] shrink-0`}
                  />
                  <Select
                    value={selectedCustomer?.id || ''}
                    onValueChange={handleCustomerPick}
                  >
                    <SelectTrigger
                      className={`${inputCls} min-w-0 flex-1 ${errors.customer ? 'border-destructive' : ''}`}
                    >
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomer && !customerOptions.some((c) => c.id === selectedCustomer.id) && (
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

      <section className="rounded-lg border border-border bg-card px-3 py-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-1.5">
            <InlineField label="Product:" required>
              <Select
                value={newItem.productId || ''}
                onValueChange={(value) => {
                  onProductSelect(value);
                  const product = products.find((p) => p.id === value);
                  if (product) {
                    setProductSearch(product.name);
                  }
                  clearFieldError('newItemProduct');
                  clearFieldError('newItemDescription');
                }}
              >
                <SelectTrigger
                  className={`${inputCls} w-full ${errors.newItemProduct ? 'border-destructive' : ''}`}
                >
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="no-products" disabled>
                      No products available
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </InlineField>
            {errors.newItemProduct && (
              <p className="pl-[116px] text-xs text-destructive">{errors.newItemProduct}</p>
            )}
            <InlineField label="Search:">
              <div className="relative">
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by Name / Item code"
                  className={inputCls}
                />
                {productSearch.trim() && filteredProducts.length > 0 && (
                  <div className="absolute z-20 mt-0.5 max-h-40 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
                    {filteredProducts.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => pickProduct(p)}
                      >
                        {p.name} ({p.sku})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </InlineField>
            <InlineField label="Discount %:">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newItem.discount}
                onChange={(e) =>
                  updateNewItem({ discount: parseFloat(e.target.value) || 0 })
                }
                className={inputCls}
              />
            </InlineField>
            <InlineField label="Units / Packs:">
              <UnitOfMeasureSelect
                value={newItem.unit || resolveItemUnit(newItem) || 'piece'}
                onChange={(unit) => updateNewItem({ unit })}
              />
            </InlineField>
          </div>

          <div className="space-y-1.5">
            <InlineField label="Item Name:">
              <Input
                value={newItem.description}
                onChange={(e) => {
                  updateNewItem({ description: e.target.value });
                  clearFieldError('newItemDescription');
                }}
                className={`${inputCls} ${errors.newItemDescription ? 'border-destructive' : ''}`}
              />
            </InlineField>
            <InlineField label="Quantity:">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={newItem.quantity}
                onChange={(e) => {
                  updateNewItem({ quantity: parseFloat(e.target.value) || 0 });
                  clearFieldError('newItemQuantity');
                }}
                className={`${inputCls} ${errors.newItemQuantity ? 'border-destructive' : ''}`}
              />
            </InlineField>
            <InlineField label="Price:">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newItem.unitPrice}
                onChange={(e) => {
                  updateNewItem({ unitPrice: parseFloat(e.target.value) || 0 });
                  clearFieldError('newItemUnitPrice');
                }}
                className={`${inputCls} ${errors.newItemUnitPrice ? 'border-destructive' : ''}`}
              />
            </InlineField>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:w-[300px] lg:w-[280px]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={() => router.push('/sales/quotes')}
            >
              Save as Quotation
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={() => router.push('/sales/quotes')}
            >
              Quotation List
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={onAddItem}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={onAddExtraItem}
            >
              Add Extra Item
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold"
              onClick={() => {
                onInputChange('paymentTerms', 'Cash');
                setPaidAmount(totals.total);
              }}
            >
              Fully Paid
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              disabled={loading}
              className="h-9 text-xs font-semibold"
            >
              {loading
                ? 'Saving...'
                : mode === 'create'
                  ? 'Generate Invoice'
                  : 'Update Invoice'}
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        {errors.items && (
          <p className="bg-destructive/10 px-3 py-1.5 text-sm text-destructive">{errors.items}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                  S No
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                  Name
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                  Qty
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                  Units
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                  Rate
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                  G Amount
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                  Extra Discount %
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                  Net Amount
                </th>
                <th className="border border-primary/80 px-2 py-1.5 text-center font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-border px-3 py-8 text-center text-muted-foreground"
                  >
                    &nbsp;
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={`${item.productId}-${index}`} className="bg-card">
                    <td className="border border-border px-2 py-1">{index + 1}</td>
                    <td className="border border-border px-2 py-1">{item.description}</td>
                    <td className="border border-border px-2 py-1 text-right">
                      {item.quantity}
                    </td>
                    <td className="border border-border px-2 py-1">
                      {formatUnitLabel(resolveItemUnit(item)) || '—'}
                    </td>
                    <td className="border border-border px-2 py-1 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right">
                      {formatCurrency(lineGross(item))}
                    </td>
                    <td className="border border-border px-2 py-1 text-right">
                      {item.discount}%
                    </td>
                    <td className="border border-border px-2 py-1 text-right font-medium">
                      {formatCurrency(lineNet(item))}
                    </td>
                    <td className="border border-border px-2 py-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <InlineField label="Total Quantity:">
              <Input readOnly value={totalQuantity} className={`${inputCls} bg-background`} />
            </InlineField>
            <InlineField label="Total GST:">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) =>
                  onInputChange('taxRate', parseFloat(e.target.value) || 0)
                }
                className={`${inputCls} bg-background`}
              />
            </InlineField>
            <InlineField label="Bill Status:">
              <Input
                readOnly
                value={paidAmount >= totals.total && totals.total > 0 ? 'paid' : 'draft'}
                className={`${inputCls} bg-background capitalize`}
              />
            </InlineField>
          </div>

          <div className="space-y-1.5">
            <InlineField label="Total Discount on Items:">
              <Input
                readOnly
                value={Math.round(totalItemDiscount * 100) / 100}
                className={`${inputCls} bg-background`}
              />
            </InlineField>
            <InlineField label="Flat Discount:">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) =>
                  onInputChange('discount', parseFloat(e.target.value) || 0)
                }
                className={`${inputCls} bg-background`}
              />
            </InlineField>
            <div className="flex min-h-[34px] items-center gap-2 pl-[116px]">
              <input
                type="checkbox"
                id="addBalanceToDiscount"
                checked={addBalanceToDiscount}
                onChange={(e) => setAddBalanceToDiscount(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="addBalanceToDiscount" className="text-xs text-muted-foreground">
                Add remaining balance to Discount
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <InlineField label="Total Amount:">
              <Input
                readOnly
                value={Math.round(totals.total * 100) / 100}
                className={`${inputCls} bg-background font-semibold`}
              />
            </InlineField>
            <InlineField label="Paid Amount:">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className={`${inputCls} bg-background`}
              />
            </InlineField>
            <InlineField label="Bill Balance:">
              <Input
                readOnly
                value={Math.round(billBalance * 100) / 100}
                className={`${inputCls} bg-background font-semibold`}
              />
            </InlineField>
          </div>
        </div>
      </section>

      <details className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Installments &amp; advanced
        </summary>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createInstallmentPlan"
              checked={createInstallmentPlan}
              onChange={(e) => setCreateInstallmentPlan(e.target.checked)}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <label htmlFor="createInstallmentPlan">Create installment plan</label>
          </div>
          {createInstallmentPlan && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input
                type="number"
                min={1}
                max={60}
                value={installmentCount}
                onChange={(e) =>
                  setInstallmentCount(parseInt(e.target.value, 10) || 1)
                }
                className={inputCls}
                placeholder="Installments"
              />
              <Select value={installmentFrequency} onValueChange={setInstallmentFrequency}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={installmentFirstDueDate}
                onChange={(e) => setInstallmentFirstDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>
      </details>

      <input type="hidden" value={formData.issueDate} readOnly />
      <input type="hidden" value={formData.currency} readOnly />

      <div className="hidden">
        <Textarea
          value={formData.terms || ''}
          onChange={(e) => onInputChange('terms', e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
