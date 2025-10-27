export interface AccountReceivable {
  id: string;
  tenant_id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  due_date: string;
  invoice_date: string;
  invoice_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  currency: string;
  status: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountReceivableCreate {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  due_date: string;
  invoice_date: string;
  invoice_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  currency?: string;
  status?: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue?: number;
}

export interface AccountReceivableUpdate {
  invoice_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  due_date?: string;
  amount_paid?: number;
  outstanding_balance?: number;
  status?: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue?: number;
}

export enum AccountReceivableStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

export interface AccountReceivablesListResponse {
  account_receivables: AccountReceivable[];
  total: number;
  total_outstanding: number;
  total_overdue: number;
}

export const getAccountReceivableStatusLabel = (status: AccountReceivableStatus): string => {
  const labels = {
    [AccountReceivableStatus.PENDING]: 'Pending',
    [AccountReceivableStatus.PARTIALLY_PAID]: 'Partially Paid',
    [AccountReceivableStatus.PAID]: 'Paid',
    [AccountReceivableStatus.OVERDUE]: 'Overdue',
    [AccountReceivableStatus.WRITTEN_OFF]: 'Written Off',
  };
  return labels[status] || status;
};

export const getAccountReceivableStatusColor = (status: AccountReceivableStatus): string => {
  const colors = {
    [AccountReceivableStatus.PENDING]: 'text-yellow-600',
    [AccountReceivableStatus.PARTIALLY_PAID]: 'text-blue-600',
    [AccountReceivableStatus.PAID]: 'text-green-600',
    [AccountReceivableStatus.OVERDUE]: 'text-red-600',
    [AccountReceivableStatus.WRITTEN_OFF]: 'text-gray-600',
  };
  return colors[status] || '';
};
