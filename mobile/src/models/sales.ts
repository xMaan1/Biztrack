export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

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

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Quote {
  id: string;
  title: string;
  description?: string;
  opportunityId: string;
  contactId?: string;
  validUntil: string;
  amount?: number;
  terms?: string;
  notes?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  quoteNumber: string;
  status: QuoteStatus;
  tenantId: string;
  createdBy: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteCreate {
  title: string;
  description?: string;
  opportunityId: string;
  validUntil: string;
  terms?: string;
  notes?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface QuoteUpdate {
  title?: string;
  description?: string;
  opportunityId?: string;
  validUntil?: string;
  terms?: string;
  notes?: string;
  items?: QuoteItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  status?: QuoteStatus;
}

export interface Contract {
  id: string;
  title: string;
  description?: string;
  opportunityId: string;
  contactId?: string;
  companyId?: string;
  startDate: string;
  endDate: string;
  value: number;
  terms?: string;
  notes?: string;
  autoRenew: boolean;
  renewalTerms?: string;
  contractNumber: string;
  status: ContractStatus;
  tenantId: string;
  createdBy: string;
  signedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractCreate {
  title: string;
  description?: string;
  opportunityId: string;
  contactId?: string;
  companyId?: string;
  startDate: string;
  endDate: string;
  value: number;
  terms?: string;
  notes?: string;
  autoRenew: boolean;
  renewalTerms?: string;
}

export interface ContractUpdate {
  title?: string;
  description?: string;
  opportunityId?: string;
  contactId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  terms?: string;
  notes?: string;
  autoRenew?: boolean;
  renewalTerms?: string;
  status?: ContractStatus;
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

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreate {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

export interface PaymentFilters {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuotesResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContractsResponse {
  contracts: Contract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InvoiceDashboard {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  averageInvoiceValue: number;
  recentInvoices: Invoice[];
  topCustomers: any[];
  statusBreakdown: {
    status: string;
    count: number;
    value: number;
  }[];
}
