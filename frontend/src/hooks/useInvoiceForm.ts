'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Invoice, InvoiceCreate, InvoiceItemCreate } from '@/src/models/sales';
import type { Product } from '@/src/models/pos';
import type { Vehicle } from '@/src/models/workshop';
import type { Customer } from '@/src/services/CustomerService';
import InvoiceService from '@/src/services/InvoiceService';
import { apiService } from '@/src/services/ApiService';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { usePlanInfo } from '@/src/hooks/usePlanInfo';
import { getCustomerDisplayName } from '@/src/utils/customerUtils';
import { resolveCustomerPhone } from '@/src/utils/phoneUtils';
import {
  calculateInvoiceTotals,
  customerFallbackFromInvoice,
  defaultDueDate,
  emptyInvoiceForm,
  EMPTY_NEW_ITEM,
  invoiceFormDataFromInvoice,
  invoiceItemsFromInvoice,
  validateInvoiceForm,
  validateNewItem,
} from '@/src/utils/sales/invoiceFormUtils';
import type {
  InstallmentPlanCreateOption,
  InvoiceFormMode,
} from '@/src/types/sales/invoiceForm';

type UseInvoiceFormOptions = {
  open: boolean;
  inline?: boolean;
  mode: InvoiceFormMode;
  invoice?: Invoice | null;
  onSubmit: (
    data: InvoiceCreate,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

export type UseInvoiceFormReturn = ReturnType<typeof useInvoiceForm>;

export function useInvoiceForm({
  open,
  inline = false,
  mode,
  invoice,
  onSubmit,
  onOpenChange,
}: UseInvoiceFormOptions) {
  const { currency } = useCurrency();
  const { planInfo } = usePlanInfo();
  const isWorkshop = planInfo?.planType === 'workshop';
  const isCommerceOrAgency =
    planInfo?.planType === 'commerce' || planInfo?.planType === 'agency';
  const useCommerceInvoiceLayout = planInfo?.planType === 'commerce';
  const isActive = inline || open;

  const [createInstallmentPlan, setCreateInstallmentPlan] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentFrequency, setInstallmentFrequency] = useState('monthly');
  const [installmentFirstDueDate, setInstallmentFirstDueDate] = useState('');
  const [formData, setFormData] = useState<InvoiceCreate>(() => emptyInvoiceForm(currency));
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItemCreate[]>([]);
  const [newItem, setNewItem] = useState<InvoiceItemCreate>({ ...EMPTY_NEW_ITEM });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [commerceFormKey, setCommerceFormKey] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiService.get('/pos/products');
      setProducts(response.products || []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    if (mode === 'create') {
      setFormData((prev) => ({ ...prev, currency }));
    }
  }, [currency, mode]);

  useEffect(() => {
    if (!isActive || mode === 'view') return;
    setCreateInstallmentPlan(false);
    setInstallmentCount(3);
    setInstallmentFrequency('monthly');
    setInstallmentFirstDueDate(
      (mode === 'edit' ? invoice?.dueDate : undefined) || defaultDueDate(),
    );
  }, [isActive, mode, invoice?.id, invoice?.dueDate]);

  useEffect(() => {
    if (isActive) fetchProducts();
  }, [isActive, fetchProducts]);

  useEffect(() => {
    if (invoice && (mode === 'edit' || mode === 'view')) {
      setFormData(invoiceFormDataFromInvoice(invoice));
      setItems(invoiceItemsFromInvoice(invoice));
      if (invoice.customerId) {
        InvoiceService.getCustomerById(invoice.customerId)
          .then(setSelectedCustomer)
          .catch(() => setSelectedCustomer(customerFallbackFromInvoice(invoice)));
      } else {
        setSelectedCustomer(null);
      }
      setSelectedVehicle(null);
    } else if (isActive) {
      setFormData(emptyInvoiceForm(currency));
      setItems([]);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
    }
    setErrors({});
  }, [invoice, mode, isActive, currency]);

  const handleInputChange = (field: keyof InvoiceCreate, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: getCustomerDisplayName(customer),
        customerEmail: customer.email ?? '',
        customerPhone: resolveCustomerPhone(customer),
      }));
      setErrors((prev) => ({
        ...prev,
        customer: '',
        customerName: '',
        customerEmail: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      }));
    }
  };

  const clearFieldError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setNewItem((prev) => ({
      ...prev,
      productId,
      description: product?.name || prev.description,
      unitPrice: product?.unitPrice ?? prev.unitPrice,
      unit: product?.unitOfMeasure || prev.unit || 'piece',
    }));
  };

  const syncProductUnit = async (productId: string, unit: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.unitOfMeasure === unit) return;
    try {
      await apiService.put(`/pos/products/${productId}`, { unitOfMeasure: unit });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, unitOfMeasure: unit as Product['unitOfMeasure'] } : p,
        ),
      );
    } catch {
    }
  };

  const resetNewItem = () => setNewItem({ ...EMPTY_NEW_ITEM });

  const addItem = async () => {
    const itemErrors = validateNewItem(newItem, isCommerceOrAgency);
    if (Object.keys(itemErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...itemErrors }));
      return;
    }
    const product = products.find((p) => p.id === newItem.productId);
    const unit = newItem.unit?.trim() || product?.unitOfMeasure || 'piece';
    setItems((prev) => [...prev, { ...newItem, unit }]);
    if (newItem.productId && unit !== product?.unitOfMeasure) {
      await syncProductUnit(newItem.productId, unit);
    }
    resetNewItem();
  };

  const addExtraItem = async () => {
    const itemErrors = validateNewItem(newItem, false);
    if (Object.keys(itemErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...itemErrors }));
      return;
    }

    const description = newItem.description.trim();
    const unit = newItem.unit?.trim() || 'piece';
    let productId = newItem.productId || '';
    const existingByName = products.find(
      (p) => p.name.toLowerCase() === description.toLowerCase(),
    );

    if (existingByName) {
      productId = existingByName.id;
    } else if (!productId) {
      try {
        setLoading(true);
        const sku = `EXT-${Date.now().toString(36).toUpperCase()}`;
        const response = await apiService.post('/pos/products', {
          name: description,
          sku,
          category: 'other',
          unitPrice: newItem.unitPrice,
          costPrice: newItem.unitPrice,
          stockQuantity: 0,
          minStockLevel: 0,
          unitOfMeasure: unit,
        });
        const created: Product = response.product;
        setProducts((prev) => [...prev, created]);
        productId = created.id;
      } catch {
        setErrors((prev) => ({
          ...prev,
          newItemDescription: 'Failed to save item to inventory',
        }));
        return;
      } finally {
        setLoading(false);
      }
    }

    setItems((prev) => [...prev, { ...newItem, description, productId, unit }]);
    resetNewItem();
  };

  const clearInvoice = useCallback(() => {
    setFormData(emptyInvoiceForm(currency));
    setItems([]);
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    resetNewItem();
    setCreateInstallmentPlan(false);
    setInstallmentCount(3);
    setInstallmentFrequency('monthly');
    setInstallmentFirstDueDate(defaultDueDate());
    setErrors({});
    setCommerceFormKey((k) => k + 1);
  }, [currency]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(
    () => calculateInvoiceTotals(formData, items),
    [formData, items],
  );

  const handleDismiss = () => {
    if (inline && mode === 'create') {
      clearInvoice();
      return;
    }
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    const validationErrors = validateInvoiceForm(formData, items, !!selectedCustomer);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const submitData: InvoiceCreate = { ...formData, items };
      const options =
        createInstallmentPlan && totals.total > 0
          ? {
              installmentPlan: {
                total_amount: totals.total,
                number_of_installments: installmentCount,
                frequency: installmentFrequency,
                first_due_date: (installmentFirstDueDate || formData.dueDate) + 'T00:00:00Z',
                currency: formData.currency,
              } as InstallmentPlanCreateOption,
            }
          : undefined;
      await onSubmit(submitData, options);
      if (inline && mode === 'create') {
        clearInvoice();
      } else {
        onOpenChange(false);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return {
    isWorkshop,
    isCommerceOrAgency,
    useCommerceInvoiceLayout,
    formData,
    items,
    newItem,
    setNewItem,
    errors,
    loading,
    products,
    selectedCustomer,
    selectedVehicle,
    setSelectedVehicle,
    createInstallmentPlan,
    installmentCount,
    installmentFrequency,
    installmentFirstDueDate,
    commerceFormKey,
    showCreateCustomerDialog,
    setShowCreateCustomerDialog,
    totals,
    handleInputChange,
    handleCustomerSelect,
    handleProductSelect,
    addItem,
    addExtraItem,
    removeItem,
    clearInvoice,
    clearFieldError,
    handleSubmit,
    handleDismiss,
    setCreateInstallmentPlan,
    setInstallmentCount,
    setInstallmentFrequency,
    setInstallmentFirstDueDate,
  };
}
