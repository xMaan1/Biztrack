import type { Invoice, InvoiceCreate, InvoiceItemCreate } from '@/src/models/sales';
import type { Customer } from '@/src/services/CustomerService';
import type { InvoiceFormErrors, InvoiceFormTotals } from '@/src/types/sales/invoiceForm';

export const EMPTY_NEW_ITEM: InvoiceItemCreate = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 0,
  productId: '',
  unit: 'piece',
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toLocalDateInputValue(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toLocalDateTimeInputValue(date: Date = new Date()): string {
  return `${toLocalDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseToLocalDateTimeInputValue(value: string): string {
  if (!value) return toLocalDateTimeInputValue();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return toLocalDateTimeInputValue();
  }
  return toLocalDateTimeInputValue(parsed);
}

export function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toLocalDateInputValue(date);
}

export function defaultOrderTime(): string {
  return toLocalDateTimeInputValue();
}

export function emptyInvoiceForm(currency: string): InvoiceCreate {
  return {
    customerId: '',
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    issueDate: toLocalDateInputValue(),
    dueDate: defaultDueDate(),
    orderNumber: '',
    orderTime: defaultOrderTime(),
    paymentTerms: 'Cash',
    currency,
    taxRate: 0,
    discount: 0,
    notes: '',
    terms: '',
    items: [],
    opportunityId: '',
    quoteId: '',
    projectId: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleVin: '',
    vehicleReg: '',
    vehicleMileage: '',
    documentNo: '',
    purchaseOrderId: '',
    jobCardId: '',
    jobDescription: '',
    partsDescription: '',
    labourTotal: 0,
    partsTotal: 0,
  };
}

export function invoiceFormDataFromInvoice(invoice: Invoice): InvoiceCreate {
  return {
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone || '',
    shippingAddress: invoice.shippingAddress || '',
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    orderNumber: invoice.orderNumber || '',
    orderTime: invoice.orderTime
      ? parseToLocalDateTimeInputValue(String(invoice.orderTime))
      : defaultOrderTime(),
    paymentTerms: invoice.paymentTerms,
    currency: invoice.currency,
    taxRate: invoice.taxRate,
    discount: invoice.discount,
    notes: invoice.notes || '',
    terms: invoice.terms || '',
    items: [],
    opportunityId: invoice.opportunityId || '',
    quoteId: invoice.quoteId || '',
    projectId: invoice.projectId || '',
    vehicleMake: invoice.vehicleMake || '',
    vehicleModel: invoice.vehicleModel || '',
    vehicleYear: invoice.vehicleYear || '',
    vehicleColor: invoice.vehicleColor || '',
    vehicleVin: invoice.vehicleVin || '',
    vehicleReg: invoice.vehicleReg || '',
    vehicleMileage: invoice.vehicleMileage || '',
    documentNo: invoice.documentNo || '',
    purchaseOrderId: invoice.purchaseOrderId || '',
    jobCardId: invoice.jobCardId || '',
    jobDescription: invoice.jobDescription || '',
    partsDescription: invoice.partsDescription || '',
    labourTotal: invoice.labourTotal || 0,
    partsTotal: invoice.partsTotal || 0,
  };
}

export function invoiceItemsFromInvoice(invoice: Invoice): InvoiceItemCreate[] {
  return invoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate,
    unit: item.unit,
    productId: item.productId,
    projectId: item.projectId,
    taskId: item.taskId,
  }));
}

export function customerFallbackFromInvoice(invoice: Invoice): Customer {
  return {
    id: invoice.customerId,
    customerId: invoice.customerId,
    firstName: invoice.customerName.split(' ')[0] || '',
    lastName: invoice.customerName.split(' ').slice(1).join(' ') || '',
    email: invoice.customerEmail,
    phone: invoice.customerPhone || '',
    customerType: 'individual',
    customerStatus: 'active',
    creditLimit: 0,
    currentBalance: 0,
    paymentTerms: 'Cash',
    tags: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function calculateInvoiceTotals(
  formData: InvoiceCreate,
  items: InvoiceItemCreate[],
): InvoiceFormTotals {
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
    0,
  );
  const workshopExtras = (formData.labourTotal || 0) + (formData.partsTotal || 0);
  const subtotal = itemsSubtotal + workshopExtras;
  const discountAmount = subtotal * (formData.discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (formData.taxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function hasWorkshopInvoiceData(invoice: Invoice): boolean {
  return Boolean(
    invoice.vehicleMake ||
      invoice.vehicleModel ||
      invoice.vehicleYear ||
      invoice.vehicleColor ||
      invoice.vehicleVin ||
      invoice.vehicleReg ||
      invoice.vehicleMileage ||
      invoice.documentNo ||
      invoice.jobDescription ||
      invoice.partsDescription ||
      invoice.labourTotal ||
      invoice.partsTotal,
  );
}

export function validateInvoiceForm(
  formData: InvoiceCreate,
  items: InvoiceItemCreate[],
  hasCustomer: boolean,
): InvoiceFormErrors {
  const newErrors: InvoiceFormErrors = {};

  if (!hasCustomer) {
    newErrors.customer = 'Please select a customer';
  }
  if (!formData.issueDate) {
    newErrors.issueDate = 'Issue date is required';
  }
  if (!formData.dueDate) {
    newErrors.dueDate = 'Due date is required';
  }
  if (items.length === 0) {
    newErrors.items = 'At least one item is required';
  }

  items.forEach((item, index) => {
    if (!item.description.trim()) {
      newErrors[`item_${index}_description`] = 'Item description is required';
    }
    if (item.quantity <= 0) {
      newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
    }
    if (item.unitPrice < 0) {
      newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
    }
  });

  return newErrors;
}

export function validateNewItem(
  newItem: InvoiceItemCreate,
  requireProduct: boolean,
): InvoiceFormErrors {
  const itemErrors: InvoiceFormErrors = {};
  if (requireProduct && !newItem.productId) {
    itemErrors.newItemProduct = 'Please select a product';
  }
  if (!newItem.description.trim()) {
    itemErrors.newItemDescription = 'Description is required';
  }
  if (newItem.quantity <= 0) {
    itemErrors.newItemQuantity = 'Quantity must be greater than 0';
  }
  if (newItem.unitPrice < 0) {
    itemErrors.newItemUnitPrice = 'Unit price cannot be negative';
  }
  return itemErrors;
}

export function getInvoiceDialogContentClassName(
  useCommerceLayout: boolean,
  isView: boolean,
  inline: boolean,
): string {
  if (useCommerceLayout && !isView) {
    return inline
      ? 'w-full min-w-0 max-w-full overflow-x-auto p-2 sm:p-3'
      : 'max-h-[96vh] w-[99vw] max-w-[1600px] overflow-y-auto p-2 sm:p-3';
  }
  return inline
    ? 'w-full min-w-0 max-w-full overflow-y-auto p-4'
    : 'max-w-4xl max-h-[90vh] overflow-y-auto';
}

export function lineItemTotal(item: InvoiceItemCreate): number {
  return item.quantity * item.unitPrice * (1 - item.discount / 100);
}
