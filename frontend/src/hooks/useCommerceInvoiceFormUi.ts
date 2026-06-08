'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Customer } from '@/src/services/CustomerService';
import type { Product } from '@/src/models/pos';
import type { InvoiceItemCreate } from '@/src/models/sales';
import InvoiceService from '@/src/services/InvoiceService';
import {
  filterProducts,
  itemFieldKey,
  parseDraftNumber,
  sumItemDiscountAmount,
  sumItemQuantities,
  type CommerceItemNumericField,
} from '@/src/utils/sales/commerceInvoiceUtils';

type UseCommerceInvoiceFormUiOptions = {
  items: InvoiceItemCreate[];
  products: Product[];
  onUpdateItem: (index: number, patch: Partial<InvoiceItemCreate>) => void;
};

export function useCommerceInvoiceFormUi({
  items,
  products,
  onUpdateItem,
}: UseCommerceInvoiceFormUiOptions) {
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [addBalanceToDiscount, setAddBalanceToDiscount] = useState(true);
  const [itemFieldDrafts, setItemFieldDrafts] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(
    () => filterProducts(products, productSearch),
    [products, productSearch],
  );

  const totalQuantity = useMemo(() => sumItemQuantities(items), [items]);
  const totalItemDiscount = useMemo(() => sumItemDiscountAmount(items), [items]);

  useEffect(() => {
    setItemFieldDrafts({});
  }, [items.length]);

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

  const getItemFieldValue = (
    index: number,
    field: CommerceItemNumericField,
    fallback: number,
  ) => {
    const draft = itemFieldDrafts[itemFieldKey(index, field)];
    return draft !== undefined ? draft : String(fallback);
  };

  const handleItemFieldChange = (
    index: number,
    field: CommerceItemNumericField,
    raw: string,
  ) => {
    setItemFieldDrafts((prev) => ({
      ...prev,
      [itemFieldKey(index, field)]: raw,
    }));
    const parsed = parseDraftNumber(raw);
    if (parsed !== null) {
      const value =
        field === 'discount'
          ? Math.min(100, Math.max(0, parsed))
          : parsed;
      onUpdateItem(index, { [field]: value });
    }
  };

  const handleItemFieldBlur = (index: number, field: CommerceItemNumericField) => {
    const key = itemFieldKey(index, field);
    const raw = itemFieldDrafts[key];
    if (raw !== undefined) {
      const parsed = parseDraftNumber(raw);
      if (parsed !== null) {
        const value =
          field === 'discount'
            ? Math.min(100, Math.max(0, parsed))
            : parsed;
        onUpdateItem(index, { [field]: value });
      }
    }
    setItemFieldDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    productSearch,
    setProductSearch,
    customerSearch,
    setCustomerSearch,
    customerOptions,
    paidAmount,
    setPaidAmount,
    addBalanceToDiscount,
    setAddBalanceToDiscount,
    filteredProducts,
    totalQuantity,
    totalItemDiscount,
    getItemFieldValue,
    handleItemFieldChange,
    handleItemFieldBlur,
  };
}
