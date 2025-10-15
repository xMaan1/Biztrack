export enum BankAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  BUSINESS = 'business',
  CREDIT_LINE = 'credit_line',
  MONEY_MARKET = 'money_market',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  INTEREST = 'interest',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum PaymentMethod {
  ONLINE_TRANSFER = 'online_transfer',
  DIRECT_DEBIT = 'direct_debit',
  WIRE_TRANSFER = 'wire_transfer',
  ACH = 'ach',
  CHECK = 'check',
  CASH = 'cash',
  CARD_PAYMENT = 'card_payment',
  MOBILE_PAYMENT = 'mobile_payment',
  CRYPTOCURRENCY = 'cryptocurrency',
}

// Bank Account Models
export interface BankAccount {
  id: string;
  tenantId: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  bankCode?: string;
  accountType: BankAccountType;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
  isActive: boolean;
  isPrimary: boolean;
  supportsOnlineBanking: boolean;
  description?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountCreate {
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  bankCode?: string;
  accountType: BankAccountType;
  currency?: string;
  currentBalance?: number;
  availableBalance?: number;
  pendingBalance?: number;
  isActive?: boolean;
  isPrimary?: boolean;
  supportsOnlineBanking?: boolean;
  description?: string;
  tags?: string[];
}

export interface BankAccountUpdate {
  accountName?: string;
  routingNumber?: string;
  bankName?: string;
  bankCode?: string;
  accountType?: BankAccountType;
  currency?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  supportsOnlineBanking?: boolean;
  description?: string;
  tags?: string[];
}

// Bank Transaction Models
export interface BankTransaction {
  id: string;
  tenantId: string;
  bankAccountId: string;
  transactionNumber: string;
  transactionDate: string;
  valueDate?: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  exchangeRate: number;
  baseAmount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  externalReference?: string;
  checkNumber?: string;
  description: string;
  memo?: string;
  category?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  counterpartyBank?: string;
  isOnlineTransaction: boolean;
  onlineTransactionId?: string;
  processingFee: number;
  isReconciled: boolean;
  reconciledDate?: string;
  reconciledBy?: string;
  relatedInvoiceId?: string;
  relatedPurchaseOrderId?: string;
  relatedExpenseId?: string;
  ledgerTransactionId?: string;
  tags: string[];
  attachments: any[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransactionCreate {
  bankAccountId: string;
  transactionDate: string;
  valueDate?: string;
  transactionType: TransactionType;
  status?: TransactionStatus;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  baseAmount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  externalReference?: string;
  checkNumber?: string;
  description: string;
  memo?: string;
  category?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  counterpartyBank?: string;
  isOnlineTransaction?: boolean;
  onlineTransactionId?: string;
  processingFee?: number;
  isReconciled?: boolean;
  reconciledDate?: string;
  relatedInvoiceId?: string;
  relatedPurchaseOrderId?: string;
  relatedExpenseId?: string;
  tags?: string[];
  attachments?: any[];
  notes?: string;
}

export interface BankTransactionUpdate {
  transactionDate?: string;
  valueDate?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  baseAmount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  externalReference?: string;
  checkNumber?: string;
  description?: string;
  memo?: string;
  category?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  counterpartyBank?: string;
  isOnlineTransaction?: boolean;
  onlineTransactionId?: string;
  processingFee?: number;
  isReconciled?: boolean;
  reconciledDate?: string;
  relatedInvoiceId?: string;
  relatedPurchaseOrderId?: string;
  relatedExpenseId?: string;
  tags?: string[];
  attachments?: any[];
  notes?: string;
}

// Online Transaction Models
export interface OnlineTransaction {
  id: string;
  tenantId: string;
  bankAccountId: string;
  bankTransactionId?: string;
  onlineTransactionId: string;
  platform: string;
  gateway?: string;
  transactionType: string;
  amount: number;
  currency: string;
  processingFee: number;
  netAmount: number;
  status: string;
  processingStatus?: string;
  settlementDate?: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  paymentMethod?: string;
  cardLastFour?: string;
  cardBrand?: string;
  orderId?: string;
  invoiceId?: string;
  description?: string;
  rawData?: any;
  webhookData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineTransactionCreate {
  bankAccountId: string;
  onlineTransactionId: string;
  platform: string;
  gateway?: string;
  transactionType: string;
  amount: number;
  currency?: string;
  processingFee?: number;
  netAmount: number;
  status: string;
  processingStatus?: string;
  settlementDate?: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  paymentMethod?: string;
  cardLastFour?: string;
  cardBrand?: string;
  orderId?: string;
  invoiceId?: string;
  description?: string;
  rawData?: any;
  webhookData?: any;
}

export interface OnlineTransactionUpdate {
  platform?: string;
  gateway?: string;
  transactionType?: string;
  amount?: number;
  currency?: string;
  processingFee?: number;
  netAmount?: number;
  status?: string;
  processingStatus?: string;
  settlementDate?: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  paymentMethod?: string;
  cardLastFour?: string;
  cardBrand?: string;
  orderId?: string;
  invoiceId?: string;
  description?: string;
  rawData?: any;
  webhookData?: any;
}

// Cash Position Models
export interface CashPosition {
  id: string;
  tenantId: string;
  positionDate: string;
  totalBankBalance: number;
  totalAvailableBalance: number;
  totalPendingBalance: number;
  totalTransactions: number;
  onlineTransactionsCount: number;
  pendingTransactionsCount: number;
  dailyInflow: number;
  dailyOutflow: number;
  netCashFlow: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashPositionCreate {
  positionDate: string;
  totalBankBalance?: number;
  totalAvailableBalance?: number;
  totalPendingBalance?: number;
  totalTransactions?: number;
  onlineTransactionsCount?: number;
  pendingTransactionsCount?: number;
  dailyInflow?: number;
  dailyOutflow?: number;
  netCashFlow?: number;
  outstandingReceivables?: number;
  outstandingPayables?: number;
}

export interface CashPositionUpdate {
  positionDate?: string;
  totalBankBalance?: number;
  totalAvailableBalance?: number;
  totalPendingBalance?: number;
  totalTransactions?: number;
  onlineTransactionsCount?: number;
  pendingTransactionsCount?: number;
  dailyInflow?: number;
  dailyOutflow?: number;
  netCashFlow?: number;
  outstandingReceivables?: number;
  outstandingPayables?: number;
}

// Response Models
export interface BankAccountResponse {
  bankAccount: BankAccount;
}

export interface BankAccountsResponse {
  bankAccounts: BankAccount[];
  total: number;
}

export interface BankTransactionResponse {
  bankTransaction: BankTransaction;
}

export interface BankTransactionsResponse {
  bankTransactions: BankTransaction[];
  total: number;
}

export interface OnlineTransactionResponse {
  onlineTransaction: OnlineTransaction;
}

export interface OnlineTransactionsResponse {
  onlineTransactions: OnlineTransaction[];
  total: number;
}

export interface CashPositionResponse {
  cashPosition: CashPosition;
}

export interface CashPositionsResponse {
  cashPositions: CashPosition[];
  total: number;
}

// Dashboard Models
export interface BankingDashboard {
  totalBankBalance: number;
  totalAvailableBalance: number;
  totalPendingBalance: number;
  totalOnlineTransactions: number;
  pendingTransactionsCount: number;
  dailyInflow: number;
  dailyOutflow: number;
  netCashFlow: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  recentTransactions: BankTransaction[];
  bankAccountsSummary: BankAccountSummary[];
}

export interface BankAccountSummary {
  id: string;
  name: string;
  bankName: string;
  accountType: BankAccountType;
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
}

// Reconciliation Models
export interface ReconciliationSummary {
  totalTransactions: number;
  reconciledTransactions: number;
  unreconciledTransactions: number;
  reconciliationPercentage: number;
  lastReconciliationDate?: string;
}

export interface TransactionReconciliation {
  bankTransactionId: string;
  isReconciled: boolean;
  reconciledDate?: string;
  reconciledBy?: string;
  notes?: string;
}

// Account Balance Models
export interface AccountBalance {
  currentBalance: number;
  pendingBalance: number;
  availableBalance: number;
}

// Utility functions
export const getAccountTypeLabel = (type: BankAccountType): string => {
  const labels = {
    [BankAccountType.CHECKING]: 'Checking',
    [BankAccountType.SAVINGS]: 'Savings',
    [BankAccountType.BUSINESS]: 'Business',
    [BankAccountType.CREDIT_LINE]: 'Credit Line',
    [BankAccountType.MONEY_MARKET]: 'Money Market',
  };
  return labels[type] || type;
};

export const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels = {
    [TransactionType.DEPOSIT]: 'Deposit',
    [TransactionType.WITHDRAWAL]: 'Withdrawal',
    [TransactionType.TRANSFER_IN]: 'Transfer In',
    [TransactionType.TRANSFER_OUT]: 'Transfer Out',
    [TransactionType.PAYMENT]: 'Payment',
    [TransactionType.REFUND]: 'Refund',
    [TransactionType.FEE]: 'Fee',
    [TransactionType.INTEREST]: 'Interest',
    [TransactionType.ADJUSTMENT]: 'Adjustment',
  };
  return labels[type] || type;
};

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  const labels = {
    [TransactionStatus.PENDING]: 'Pending',
    [TransactionStatus.PROCESSING]: 'Processing',
    [TransactionStatus.COMPLETED]: 'Completed',
    [TransactionStatus.FAILED]: 'Failed',
    [TransactionStatus.CANCELLED]: 'Cancelled',
    [TransactionStatus.REVERSED]: 'Reversed',
  };
  return labels[status] || status;
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels = {
    [PaymentMethod.ONLINE_TRANSFER]: 'Online Transfer',
    [PaymentMethod.DIRECT_DEBIT]: 'Direct Debit',
    [PaymentMethod.WIRE_TRANSFER]: 'Wire Transfer',
    [PaymentMethod.ACH]: 'ACH',
    [PaymentMethod.CHECK]: 'Check',
    [PaymentMethod.CASH]: 'Cash',
    [PaymentMethod.CARD_PAYMENT]: 'Card Payment',
    [PaymentMethod.MOBILE_PAYMENT]: 'Mobile Payment',
    [PaymentMethod.CRYPTOCURRENCY]: 'Cryptocurrency',
  };
  return labels[method] || method;
};
