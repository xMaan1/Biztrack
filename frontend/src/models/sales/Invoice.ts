export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  VOID = 'void',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CREDIT = 'credit',
  OTHER = 'other',
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  productId?: string;
  productSku?: string;
  projectId?: string;
  taskId?: string;
}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  productId?: string;
  projectId?: string;
  taskId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  orderNumber?: string;
  orderTime?: string;
  paymentTerms: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  opportunityId?: string;
  quoteId?: string;
  projectId?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  overdueAt?: string;
  createdAt: string;
  updatedAt: string;
  payments: any[];
  totalPaid: number;
  balance: number;
  daysOverdue: number;

  // Vehicle details for workshop invoices
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleVin?: string;
  vehicleReg?: string;
  vehicleMileage?: string;

  // Workshop specific fields
  jobDescription?: string;
  partsDescription?: string;
  labourTotal?: number;
  partsTotal?: number;
}

export interface InvoiceCreate {
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress?: string;
  issueDate: string;
  dueDate: string;
  orderNumber?: string;
  orderTime?: string;
  paymentTerms: string;
  currency: string;
  taxRate: number;
  discount: number;
  notes?: string;
  terms?: string;
  items: InvoiceItemCreate[];
  opportunityId?: string;
  quoteId?: string;
  projectId?: string;

  // Vehicle details for workshop invoices
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleVin?: string;
  vehicleReg?: string;
  vehicleMileage?: string;

  // Workshop specific fields
  jobDescription?: string;
  partsDescription?: string;
  labourTotal?: number;
  partsTotal?: number;
}

export interface InvoiceUpdate {
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  issueDate?: string;
  dueDate?: string;
  orderNumber?: string;
  orderTime?: string;
  paymentTerms?: string;
  currency?: string;
  taxRate?: number;
  discount?: number;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
  items?: InvoiceItemCreate[];

  // Vehicle details for workshop invoices
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehicleVin?: string;
  vehicleReg?: string;
  vehicleMileage?: string;

  // Workshop specific fields
  jobDescription?: string;
  partsDescription?: string;
  labourTotal?: number;
  partsTotal?: number;
}

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}
