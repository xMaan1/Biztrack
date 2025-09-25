// Ledger Models

export interface ChartOfAccounts {
  id: string;
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_category: AccountCategory;
  description?: string;
  parent_account_id?: string;
  is_active: boolean;
  is_system_account: boolean;
  opening_balance: number;
  current_balance: number;
  currency: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccountsCreate {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_category: AccountCategory;
  description?: string;
  parent_account_id?: string;
  opening_balance?: number;
  currency?: string;
}

export interface ChartOfAccountsUpdate {
  account_code?: string;
  account_name?: string;
  account_type?: AccountType;
  account_category?: AccountCategory;
  description?: string;
  parent_account_id?: string;
  opening_balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface ChartOfAccountsResponse {
  id: string;
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  description?: string;
  parent_account_id?: string;
  is_active: boolean;
  is_system_account: boolean;
  opening_balance: number;
  current_balance: number;
  currency: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransaction {
  id: string;
  tenant_id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  currency: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  description: string;
  notes?: string;
  tags: string[];
  attachments: string[];
  created_by_id: string;
  approved_by_id?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransactionCreate {
  transaction_date: string;
  transaction_type: TransactionType;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  currency?: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  description: string;
  notes?: string;
  tags?: string[];
  attachments?: string[];
}

export interface LedgerTransactionUpdate {
  transaction_date?: string;
  transaction_type?: TransactionType;
  debit_account_id?: string;
  credit_account_id?: string;
  amount?: number;
  currency?: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  attachments?: string[];
  status?: TransactionStatus;
}

export interface LedgerTransactionResponse {
  id: string;
  tenant_id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string;
  status: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  currency: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  description: string;
  notes?: string;
  tags: string[];
  attachments: string[];
  created_by_id: string;
  approved_by_id?: string;
  journal_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  entry_date: string;
  reference_number?: string;
  description: string;
  notes?: string;
  status: string;
  is_posted: boolean;
  posted_at?: string;
  posted_by_id?: string;
  tags: string[];
  attachments: string[];
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  entry_date: string;
  reference_number?: string;
  description: string;
  notes?: string;
  tags?: string[];
  attachments?: string[];
}

export interface JournalEntryUpdate {
  entry_date?: string;
  reference_number?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  attachments?: string[];
}

export interface JournalEntryResponse {
  id: string;
  tenant_id: string;
  entry_number: string;
  entry_date: string;
  reference_number?: string;
  description: string;
  notes?: string;
  status: string;
  is_posted: boolean;
  posted_at?: string;
  posted_by_id?: string;
  tags: string[];
  attachments: string[];
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriod {
  id: string;
  tenant_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by_id?: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  notes?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriodCreate {
  period_name: string;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface FinancialPeriodUpdate {
  period_name?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface FinancialPeriodResponse {
  id: string;
  tenant_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string;
  closed_by_id?: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  notes?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  tenant_id: string;
  budget_name: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  status: string;
  is_active: boolean;
  description?: string;
  notes?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  budget_name: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  description?: string;
  notes?: string;
}

export interface BudgetUpdate {
  budget_name?: string;
  budget_type?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  description?: string;
  notes?: string;
  status?: string;
  is_active?: boolean;
}

export interface BudgetResponse {
  id: string;
  tenant_id: string;
  budget_name: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  status: string;
  is_active: boolean;
  description?: string;
  notes?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  account_id: string;
  budgeted_amount: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItemCreate {
  budget_id: string;
  account_id: string;
  budgeted_amount: number;
  notes?: string;
}

export interface BudgetItemUpdate {
  budgeted_amount?: number;
  notes?: string;
}

export interface BudgetItemResponse {
  id: string;
  budget_id: string;
  account_id: string;
  budgeted_amount: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Financial Reports
export interface TrialBalanceAccount {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalanceResponse {
  as_of_date: string;
  accounts: TrialBalanceAccount[];
}

export interface IncomeStatementPeriod {
  start_date: string;
  end_date: string;
}

export interface IncomeStatementResponse {
  period: IncomeStatementPeriod;
  revenue: number;
  expenses: number;
  net_income: number;
}

export interface BalanceSheetAccount {
  account_id: string;
  account_name: string;
  balance: number;
}

export interface BalanceSheetSection {
  total: number;
  accounts: BalanceSheetAccount[];
}

export interface BalanceSheetResponse {
  as_of_date: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  total_liabilities_and_equity: number;
}

// Enums
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum AccountCategory {
  // Asset accounts
  CASH = 'cash',
  BANK_ACCOUNT = 'bank_account',
  ACCOUNTS_RECEIVABLE = 'accounts_receivable',
  INVENTORY = 'inventory',
  EQUIPMENT = 'equipment',
  BUILDINGS = 'buildings',
  VEHICLES = 'vehicles',
  PREPAID_EXPENSES = 'prepaid_expenses',

  // Liability accounts
  ACCOUNTS_PAYABLE = 'accounts_payable',
  LOANS_PAYABLE = 'loans_payable',
  CREDIT_CARDS = 'credit_cards',
  TAXES_PAYABLE = 'taxes_payable',
  WAGES_PAYABLE = 'wages_payable',

  // Equity accounts
  OWNER_EQUITY = 'owner_equity',
  RETAINED_EARNINGS = 'retained_earnings',
  COMMON_STOCK = 'common_stock',

  // Revenue accounts
  SALES_REVENUE = 'sales_revenue',
  SERVICE_REVENUE = 'service_revenue',
  INTEREST_INCOME = 'interest_income',
  OTHER_INCOME = 'other_income',

  // Expense accounts
  COST_OF_GOODS_SOLD = 'cost_of_goods_sold',
  SALARIES_WAGES = 'salaries_wages',
  RENT_EXPENSE = 'rent_expense',
  UTILITIES = 'utilities',
  INSURANCE = 'insurance',
  MAINTENANCE = 'maintenance',
  MARKETING = 'marketing',
  OFFICE_SUPPLIES = 'office_supplies',
  TRAVEL = 'travel',
  PROFESSIONAL_FEES = 'professional_fees',
  DEPRECIATION = 'depreciation',
  AMORTIZATION = 'amortization',
  INTEREST_EXPENSE = 'interest_expense',
  OTHER_EXPENSES = 'other_expenses',
}

// Utility functions
export const getAccountTypeLabel = (type: AccountType): string => {
  const labels: Record<AccountType, string> = {
    [AccountType.ASSET]: 'Asset',
    [AccountType.LIABILITY]: 'Liability',
    [AccountType.EQUITY]: 'Equity',
    [AccountType.REVENUE]: 'Revenue',
    [AccountType.EXPENSE]: 'Expense',
  };
  return labels[type] || type;
};

export const getAccountCategoryLabel = (category: AccountCategory): string => {
  const labels: Record<AccountCategory, string> = {
    [AccountCategory.CASH]: 'Cash',
    [AccountCategory.BANK_ACCOUNT]: 'Bank Account',
    [AccountCategory.ACCOUNTS_RECEIVABLE]: 'Accounts Receivable',
    [AccountCategory.INVENTORY]: 'Inventory',
    [AccountCategory.EQUIPMENT]: 'Equipment',
    [AccountCategory.BUILDINGS]: 'Buildings',
    [AccountCategory.VEHICLES]: 'Vehicles',
    [AccountCategory.PREPAID_EXPENSES]: 'Prepaid Expenses',
    [AccountCategory.ACCOUNTS_PAYABLE]: 'Accounts Payable',
    [AccountCategory.LOANS_PAYABLE]: 'Loans Payable',
    [AccountCategory.CREDIT_CARDS]: 'Credit Cards',
    [AccountCategory.TAXES_PAYABLE]: 'Taxes Payable',
    [AccountCategory.WAGES_PAYABLE]: 'Wages Payable',
    [AccountCategory.OWNER_EQUITY]: 'Owner Equity',
    [AccountCategory.RETAINED_EARNINGS]: 'Retained Earnings',
    [AccountCategory.COMMON_STOCK]: 'Common Stock',
    [AccountCategory.SALES_REVENUE]: 'Sales Revenue',
    [AccountCategory.SERVICE_REVENUE]: 'Service Revenue',
    [AccountCategory.INTEREST_INCOME]: 'Interest Income',
    [AccountCategory.OTHER_INCOME]: 'Other Income',
    [AccountCategory.COST_OF_GOODS_SOLD]: 'Cost of Goods Sold',
    [AccountCategory.SALARIES_WAGES]: 'Salaries & Wages',
    [AccountCategory.RENT_EXPENSE]: 'Rent Expense',
    [AccountCategory.UTILITIES]: 'Utilities',
    [AccountCategory.INSURANCE]: 'Insurance',
    [AccountCategory.MAINTENANCE]: 'Maintenance',
    [AccountCategory.MARKETING]: 'Marketing',
    [AccountCategory.OFFICE_SUPPLIES]: 'Office Supplies',
    [AccountCategory.TRAVEL]: 'Travel',
    [AccountCategory.PROFESSIONAL_FEES]: 'Professional Fees',
    [AccountCategory.DEPRECIATION]: 'Depreciation',
    [AccountCategory.AMORTIZATION]: 'Amortization',
    [AccountCategory.INTEREST_EXPENSE]: 'Interest Expense',
    [AccountCategory.OTHER_EXPENSES]: 'Other Expenses',
  };
  return labels[category] || category;
};

export const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    [TransactionType.INCOME]: 'Income',
    [TransactionType.EXPENSE]: 'Expense',
    [TransactionType.TRANSFER]: 'Transfer',
    [TransactionType.ADJUSTMENT]: 'Adjustment',
    [TransactionType.REFUND]: 'Refund',
  };
  return labels[type] || type;
};

export const getTransactionStatusLabel = (
  status: TransactionStatus,
): string => {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'Pending',
    [TransactionStatus.COMPLETED]: 'Completed',
    [TransactionStatus.CANCELLED]: 'Cancelled',
    [TransactionStatus.FAILED]: 'Failed',
  };
  return labels[status] || status;
};

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getAccountTypeColor = (type: AccountType): string => {
  const colors: Record<AccountType, string> = {
    [AccountType.ASSET]: 'text-green-600',
    [AccountType.LIABILITY]: 'text-red-600',
    [AccountType.EQUITY]: 'text-blue-600',
    [AccountType.REVENUE]: 'text-emerald-600',
    [AccountType.EXPENSE]: 'text-orange-600',
  };
  return colors[type] || 'text-gray-600';
};

export const getTransactionTypeColor = (type: TransactionType): string => {
  const colors: Record<TransactionType, string> = {
    [TransactionType.INCOME]: 'text-green-600',
    [TransactionType.EXPENSE]: 'text-red-600',
    [TransactionType.TRANSFER]: 'text-blue-600',
    [TransactionType.ADJUSTMENT]: 'text-yellow-600',
    [TransactionType.REFUND]: 'text-purple-600',
  };
  return colors[type] || 'text-gray-600';
};
