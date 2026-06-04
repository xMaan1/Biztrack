'use client';

import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Textarea } from '@/src/components/ui/textarea';
import type { Product } from '@/src/models/pos';
import { useCommerceInvoiceFormUi } from '@/src/hooks/useCommerceInvoiceFormUi';
import { CommerceInvoiceDetailsSection } from './CommerceInvoiceDetailsSection';
import { CommerceInvoiceFormHeader } from './CommerceInvoiceFormHeader';
import { CommerceInvoiceInstallmentSection } from './CommerceInvoiceInstallmentSection';
import { CommerceInvoiceItemsTable } from './CommerceInvoiceItemsTable';
import { CommerceInvoiceProductEntrySection } from './CommerceInvoiceProductEntrySection';
import { CommerceInvoiceTotalsSection } from './CommerceInvoiceTotalsSection';
import type { CommerceInvoiceFormProps } from './types';

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
  onUpdateItem,
  onClearInvoice,
  onNewCustomer,
  setCreateInstallmentPlan,
  setInstallmentCount,
  setInstallmentFrequency,
  setInstallmentFirstDueDate,
  clearFieldError,
}: CommerceInvoiceFormProps) {
  const ui = useCommerceInvoiceFormUi({ items, products, onUpdateItem });

  const handleOrderTimeChange = (value: string) => {
    onInputChange('orderTime', value);
    if (value) {
      onInputChange('issueDate', value.slice(0, 10));
    }
  };

  const pickProduct = (product: Product) => {
    onProductSelect(product.id);
    ui.setProductSearch(product.name);
    clearFieldError('newItemProduct');
    clearFieldError('newItemDescription');
  };

  const handleCustomerPick = (customerId: string) => {
    const customer = ui.customerOptions.find((c) => c.id === customerId);
    if (customer) {
      onCustomerSelect(customer);
      ui.setCustomerSearch('');
    }
  };

  return (
    <div className="flex flex-col gap-2 text-foreground">
      <CommerceInvoiceFormHeader mode={mode} onClearInvoice={onClearInvoice} />

      <CommerceInvoiceDetailsSection
        formData={formData}
        errors={errors}
        selectedCustomer={selectedCustomer}
        customerSearch={ui.customerSearch}
        customerOptions={ui.customerOptions}
        onInputChange={onInputChange}
        onCustomerSearchChange={ui.setCustomerSearch}
        onCustomerPick={handleCustomerPick}
        onOrderTimeChange={handleOrderTimeChange}
        onNewCustomer={onNewCustomer}
      />

      <CommerceInvoiceProductEntrySection
        mode={mode}
        loading={loading}
        errors={errors}
        newItem={newItem}
        products={products}
        productSearch={ui.productSearch}
        totals={totals}
        onProductSearchChange={ui.setProductSearch}
        onProductSelect={onProductSelect}
        onNewItemChange={onNewItemChange}
        onAddItem={onAddItem}
        onAddExtraItem={onAddExtraItem}
        onInputChange={onInputChange}
        onSetPaidAmount={ui.setPaidAmount}
        clearFieldError={clearFieldError}
      />

      <CommerceInvoiceItemsTable
        items={items}
        products={products}
        productSearch={ui.productSearch}
        searchResults={ui.filteredProducts}
        itemsError={errors.items}
        getItemFieldValue={ui.getItemFieldValue}
        onItemFieldChange={ui.handleItemFieldChange}
        onItemFieldBlur={ui.handleItemFieldBlur}
        onRemoveItem={onRemoveItem}
        onPickProduct={pickProduct}
      />

      <CommerceInvoiceTotalsSection
        formData={formData}
        totals={totals}
        totalQuantity={ui.totalQuantity}
        totalItemDiscount={ui.totalItemDiscount}
        paidAmount={ui.paidAmount}
        addBalanceToDiscount={ui.addBalanceToDiscount}
        onInputChange={onInputChange}
        onPaidAmountChange={ui.setPaidAmount}
        onAddBalanceToDiscountChange={ui.setAddBalanceToDiscount}
      />

      <CommerceInvoiceInstallmentSection
        createInstallmentPlan={createInstallmentPlan}
        installmentCount={installmentCount}
        installmentFrequency={installmentFrequency}
        installmentFirstDueDate={installmentFirstDueDate}
        setCreateInstallmentPlan={setCreateInstallmentPlan}
        setInstallmentCount={setInstallmentCount}
        setInstallmentFrequency={setInstallmentFrequency}
        setInstallmentFirstDueDate={setInstallmentFirstDueDate}
      />

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
