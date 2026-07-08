'use client';

import type { UseInvoiceFormReturn } from '@/src/hooks/useInvoiceForm';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';
import { InvoiceFormCustomerSection } from './InvoiceFormCustomerSection';
import { InvoiceFormDetailsSection } from './InvoiceFormDetailsSection';
import { InvoiceFormVehicleSection } from './InvoiceFormVehicleSection';
import { InvoiceFormItemsSection } from './InvoiceFormItemsSection';
import { InvoiceFormTotalsSummary } from './InvoiceFormTotalsSummary';
import { InvoiceFormNotesSection } from './InvoiceFormNotesSection';
import { InvoiceInstallmentSection } from './InvoiceInstallmentSection';
import { InvoiceFormActions } from './InvoiceFormActions';
import { WorkshopDocumentLinks } from '../../workshop/WorkshopDocumentLinks';

type WorkshopInvoiceFormProps = {
  mode: InvoiceFormMode;
  form: UseInvoiceFormReturn;
  error?: string | null;
};

export function WorkshopInvoiceForm({ mode, form, error }: WorkshopInvoiceFormProps) {
  const clearNewItemErrors = () => {
    form.clearFieldError('newItemProduct');
    form.clearFieldError('newItemDescription');
    form.clearFieldError('newItemQuantity');
    form.clearFieldError('newItemUnitPrice');
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      <InvoiceFormCustomerSection
        mode={mode}
        selectedCustomer={form.selectedCustomer}
        customerError={form.errors.customer}
        onCustomerSelect={form.handleCustomerSelect}
        onNewCustomer={() => form.setShowCreateCustomerDialog(true)}
      />
      <InvoiceFormDetailsSection
        formData={form.formData}
        errors={form.errors}
        onInputChange={form.handleInputChange}
      />
      {form.isWorkshop && (
        <InvoiceFormVehicleSection
          formData={form.formData}
          selectedVehicle={form.selectedVehicle}
          onVehicleSelect={form.setSelectedVehicle}
          onInputChange={form.handleInputChange}
        />
      )}
      {form.isWorkshop && (
        <WorkshopDocumentLinks
          excludeType="invoice"
          value={form.documentLinks}
          onChange={form.setDocumentLinks}
        />
      )}
      <InvoiceFormItemsSection
        items={form.items}
        newItem={form.newItem}
        products={form.products}
        errors={form.errors}
        onNewItemChange={form.setNewItem}
        onAddItem={form.addItem}
        onRemoveItem={form.removeItem}
        clearNewItemErrors={clearNewItemErrors}
      />
      <InvoiceFormTotalsSummary formData={form.formData} totals={form.totals} />
      <InvoiceFormNotesSection formData={form.formData} onInputChange={form.handleInputChange} />
      {form.isCommerceOrAgency && mode !== 'view' && (
        <InvoiceInstallmentSection
          createInstallmentPlan={form.createInstallmentPlan}
          installmentCount={form.installmentCount}
          installmentFrequency={form.installmentFrequency}
          installmentFirstDueDate={form.installmentFirstDueDate}
          onToggle={form.setCreateInstallmentPlan}
          onCountChange={form.setInstallmentCount}
          onFrequencyChange={form.setInstallmentFrequency}
          onFirstDueDateChange={form.setInstallmentFirstDueDate}
        />
      )}
      <InvoiceFormActions mode={mode} loading={form.loading} error={error} onCancel={form.handleDismiss} />
    </form>
  );
}
