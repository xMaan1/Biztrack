export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  description: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  is_system_account: boolean;
  currency: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // Asset Accounts (1000-1999)
  {
    id: 'acc-1000',
    account_code: '1000',
    account_name: 'Cash',
    account_type: 'asset',
    account_category: 'cash',
    description: 'Cash on hand and in bank accounts',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1100',
    account_code: '1100',
    account_name: 'Accounts Receivable',
    account_type: 'asset',
    account_category: 'accounts_receivable',
    description: 'Amounts owed by customers',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1200',
    account_code: '1200',
    account_name: 'Inventory',
    account_type: 'asset',
    account_category: 'inventory',
    description: 'Raw materials, work in progress, and finished goods',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1300',
    account_code: '1300',
    account_name: 'Equipment',
    account_type: 'asset',
    account_category: 'equipment',
    description: 'Machinery, tools, and equipment',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1400',
    account_code: '1400',
    account_name: 'Buildings',
    account_type: 'asset',
    account_category: 'buildings',
    description: 'Buildings and structures',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1500',
    account_code: '1500',
    account_name: 'Vehicles',
    account_type: 'asset',
    account_category: 'vehicles',
    description: 'Company vehicles',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-1600',
    account_code: '1600',
    account_name: 'Prepaid Expenses',
    account_type: 'asset',
    account_category: 'prepaid_expenses',
    description: 'Expenses paid in advance',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },

  // Liability Accounts (2000-2999)
  {
    id: 'acc-2000',
    account_code: '2000',
    account_name: 'Accounts Payable',
    account_type: 'liability',
    account_category: 'accounts_payable',
    description: 'Amounts owed to suppliers and vendors',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-2100',
    account_code: '2100',
    account_name: 'Loans Payable',
    account_type: 'liability',
    account_category: 'loans_payable',
    description: 'Bank loans and other borrowings',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-2200',
    account_code: '2200',
    account_name: 'Credit Cards',
    account_type: 'liability',
    account_category: 'credit_cards',
    description: 'Credit card balances',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-2300',
    account_code: '2300',
    account_name: 'Taxes Payable',
    account_type: 'liability',
    account_category: 'taxes_payable',
    description: 'Sales tax, income tax, and other taxes',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-2400',
    account_code: '2400',
    account_name: 'Wages Payable',
    account_type: 'liability',
    account_category: 'wages_payable',
    description: 'Accrued wages and salaries',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },

  // Equity Accounts (3000-3999)
  {
    id: 'acc-3000',
    account_code: '3000',
    account_name: 'Owner Equity',
    account_type: 'equity',
    account_category: 'owner_equity',
    description: 'Owner\'s investment in the business',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-3100',
    account_code: '3100',
    account_name: 'Retained Earnings',
    account_type: 'equity',
    account_category: 'retained_earnings',
    description: 'Accumulated profits retained in the business',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-3200',
    account_code: '3200',
    account_name: 'Common Stock',
    account_type: 'equity',
    account_category: 'common_stock',
    description: 'Common stock issued',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },

  // Revenue Accounts (4000-4999)
  {
    id: 'acc-4000',
    account_code: '4000',
    account_name: 'Sales Revenue',
    account_type: 'revenue',
    account_category: 'sales_revenue',
    description: 'Revenue from sales of goods and services',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-4100',
    account_code: '4100',
    account_name: 'Service Revenue',
    account_type: 'revenue',
    account_category: 'service_revenue',
    description: 'Revenue from services provided',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-4200',
    account_code: '4200',
    account_name: 'Interest Income',
    account_type: 'revenue',
    account_category: 'interest_income',
    description: 'Interest earned on investments and loans',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-4900',
    account_code: '4900',
    account_name: 'Other Income',
    account_type: 'revenue',
    account_category: 'other_income',
    description: 'Miscellaneous income',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },

  // Expense Accounts (5000-5999)
  {
    id: 'acc-5000',
    account_code: '5000',
    account_name: 'Cost of Goods Sold',
    account_type: 'expense',
    account_category: 'cost_of_goods_sold',
    description: 'Direct costs of producing goods sold',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5100',
    account_code: '5100',
    account_name: 'Salaries & Wages',
    account_type: 'expense',
    account_category: 'salaries_wages',
    description: 'Employee salaries and wages',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5200',
    account_code: '5200',
    account_name: 'Rent Expense',
    account_type: 'expense',
    account_category: 'rent_expense',
    description: 'Rent for office, warehouse, and equipment',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5300',
    account_code: '5300',
    account_name: 'Utilities',
    account_type: 'expense',
    account_category: 'utilities',
    description: 'Electricity, water, gas, and other utilities',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5400',
    account_code: '5400',
    account_name: 'Insurance',
    account_type: 'expense',
    account_category: 'insurance',
    description: 'Business insurance premiums',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5500',
    account_code: '5500',
    account_name: 'Maintenance',
    account_type: 'expense',
    account_category: 'maintenance',
    description: 'Equipment and facility maintenance',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5600',
    account_code: '5600',
    account_name: 'Marketing',
    account_type: 'expense',
    account_category: 'marketing',
    description: 'Advertising and marketing expenses',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5700',
    account_code: '5700',
    account_name: 'Office Supplies',
    account_type: 'expense',
    account_category: 'office_supplies',
    description: 'Office supplies and materials',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5800',
    account_code: '5800',
    account_name: 'Travel',
    account_type: 'expense',
    account_category: 'travel',
    description: 'Business travel expenses',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5900',
    account_code: '5900',
    account_name: 'Professional Fees',
    account_type: 'expense',
    account_category: 'professional_fees',
    description: 'Legal, accounting, and consulting fees',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5950',
    account_code: '5950',
    account_name: 'Depreciation',
    account_type: 'expense',
    account_category: 'depreciation',
    description: 'Depreciation of fixed assets',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5960',
    account_code: '5960',
    account_name: 'Interest Expense',
    account_type: 'expense',
    account_category: 'interest_expense',
    description: 'Interest on loans and credit',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  },
  {
    id: 'acc-5999',
    account_code: '5999',
    account_name: 'Other Expenses',
    account_type: 'expense',
    account_category: 'other_expenses',
    description: 'Miscellaneous expenses',
    opening_balance: 0,
    current_balance: 0,
    is_active: true,
    is_system_account: true,
    currency: 'USD'
  }
];

export const getAccountsByType = (accountType: string): ChartOfAccount[] => {
  return DEFAULT_CHART_OF_ACCOUNTS.filter(account => account.account_type === accountType);
};

export const getAccountById = (id: string): ChartOfAccount | undefined => {
  return DEFAULT_CHART_OF_ACCOUNTS.find(account => account.id === id);
};

export const getAccountByCode = (code: string): ChartOfAccount | undefined => {
  return DEFAULT_CHART_OF_ACCOUNTS.find(account => account.account_code === code);
};

export const getAccountTypeCount = (accountType: string): number => {
  return DEFAULT_CHART_OF_ACCOUNTS.filter(account => account.account_type === accountType).length;
};

export const getTotalBalanceByType = (accountType: string): number => {
  return DEFAULT_CHART_OF_ACCOUNTS
    .filter(account => account.account_type === accountType)
    .reduce((sum, account) => sum + account.current_balance, 0);
};


