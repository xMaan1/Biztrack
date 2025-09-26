'use client';

import React, { useState } from 'react';
import { useParallelApi, createApiCall } from '../../hooks/useParallelApi';
import { apiClient } from '../../services/apiClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  BookOpen,
  FileText,
  PieChart,
  Plus,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { usePlanInfo } from '@/src/hooks/usePlanInfo';
import LedgerService from '@/src/services/ledgerService';
import DashboardLayout from '@/src/components/layout/DashboardLayout';
import {
  ChartOfAccountsResponse,
  LedgerTransactionResponse,
  BudgetResponse,
  TrialBalanceResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
  AccountType,
  TransactionType,
  formatCurrency,
  getAccountTypeLabel,
  getTransactionTypeLabel,
  getAccountTypeColor,
} from '@/src/models/ledger';
import { useCachedApi } from '../../hooks/useCachedApi';

export default function LedgerDashboard() {
  const { planInfo } = usePlanInfo();
  
  const { data: chartOfAccounts, loading: accountsLoading, refetch: refetchAccounts } = useCachedApi<ChartOfAccountsResponse[]>(
    'ledger_chart_of_accounts',
    () => LedgerService.getChartOfAccounts(),
    { ttl: 300000 }
  );
  
  const { data: recentTransactions, loading: transactionsLoading, refetch: refetchTransactions } = useCachedApi<LedgerTransactionResponse[]>(
    'ledger_recent_transactions',
    () => LedgerService.getRecentTransactions(10),
    { ttl: 60000 }
  );
  
  const { data: activeBudgets, loading: budgetsLoading, refetch: refetchBudgets } = useCachedApi<BudgetResponse[]>(
    'ledger_active_budgets',
    () => LedgerService.getActiveBudgets(),
    { ttl: 300000 }
  );
  
  const { data: trialBalance, loading: trialBalanceLoading, refetch: refetchTrialBalance } = useCachedApi<TrialBalanceResponse>(
    'ledger_trial_balance',
    () => LedgerService.getTrialBalance(),
    { ttl: 300000 }
  );
  
  const { data: incomeStatement, loading: incomeStatementLoading, refetch: refetchIncomeStatement } = useCachedApi<IncomeStatementResponse>(
    'ledger_income_statement',
    () => LedgerService.getIncomeStatement(),
    { ttl: 300000 }
  );

  // Summary states
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalEquity, setTotalEquity] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  // Modal states
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [showAccountBalanceModal, setShowAccountBalanceModal] = useState(false);
  const [showFinancialReportModal, setShowFinancialReportModal] =
    useState(false);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const [journalEntryForm, setJournalEntryForm] = useState({
    entryNumber: '',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
  });

  const [accountBalanceForm, setAccountBalanceForm] = useState({
    accountId: '',
    asOfDate: new Date().toISOString().split('T')[0],
  });

  const [financialReportForm, setFinancialReportForm] = useState({
    reportType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Calculate summary data when cached data is loaded
  React.useEffect(() => {
    if (trialBalance) {
      setTotalAssets(trialBalance.assets || 0);
      setTotalLiabilities(trialBalance.liabilities || 0);
      setTotalEquity(trialBalance.equity || 0);
    }
  }, [trialBalance]);

  React.useEffect(() => {
    if (incomeStatement) {
      setTotalRevenue(incomeStatement.totalRevenue || 0);
      setTotalExpenses(incomeStatement.totalExpenses || 0);
      setNetIncome(incomeStatement.netIncome || 0);
    }
  }, [incomeStatement]);

  // Clear error when component mounts or planInfo changes
  useEffect(() => {
    setError(null);
  }, []);

  // Add a manual refresh function
  const handleRefresh = () => {
    // The parallel API hook will handle refreshing automatically
    window.location.reload();
  };

  // Reset component state
  const handleReset = () => {
    setError(null);
    setLoading(true);
    setChartOfAccounts([]);
    setRecentTransactions([]);
    // setRecentJournalEntries([]);
    setActiveBudgets([]);
    setTrialBalance(null);
    setIncomeStatement(null);
    // setBalanceSheet(null);
    fetchLedgerData();
  };

  // Modal handlers
  const handleNewTransaction = () => {
    setShowNewTransactionModal(true);
  };
  const handleJournalEntry = () => {
    setShowJournalEntryModal(true);
  };
  const handleAccountBalance = () => {
    setShowAccountBalanceModal(true);
  };
  const handleFinancialReport = () => {
    setShowFinancialReportModal(true);
  };

  // Modal close handlers with form reset
  const closeTransactionModal = () => {
    setShowNewTransactionModal(false);
    setTransactionForm({
      description: '',
      amount: '',
      debitAccountId: '',
      creditAccountId: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
  };

  const closeJournalEntryModal = () => {
    setShowJournalEntryModal(false);
    setJournalEntryForm({
      entryNumber: '',
      description: '',
      entryDate: new Date().toISOString().split('T')[0],
    });
  };

  const closeAccountBalanceModal = () => {
    setShowAccountBalanceModal(false);
    setAccountBalanceForm({
      accountId: '',
      asOfDate: new Date().toISOString().split('T')[0],
    });
  };

  const closeFinancialReportModal = () => {
    setShowFinancialReportModal(false);
    setFinancialReportForm({
      reportType: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  };

  // Form submission handlers
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !transactionForm.debitAccountId ||
        !transactionForm.creditAccountId ||
        !transactionForm.amount
      ) {
        alert('Please fill in all required fields');
        return;
      }

      const transactionData = {
        description: transactionForm.description,
        amount: parseFloat(transactionForm.amount),
        debit_account_id: transactionForm.debitAccountId,
        credit_account_id: transactionForm.creditAccountId,
        transaction_date: transactionForm.transactionDate,
        transaction_type: 'GENERAL' as TransactionType,
        currency: 'USD',
      };

      await LedgerService.createLedgerTransaction(transactionData);
      alert('Transaction created successfully!');
      closeTransactionModal();
      handleRefresh();
    } catch (error) {
      alert('Failed to create transaction. Please try again.');
    }
  };

  const handleJournalEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!journalEntryForm.description) {
        alert('Please fill in the description');
        return;
      }

      const journalData = {
        description: journalEntryForm.description,
        entry_date: journalEntryForm.entryDate,
        reference_number: journalEntryForm.entryNumber || undefined,
      };

      await LedgerService.createJournalEntry(journalData);
      alert('Journal entry created successfully!');
      closeJournalEntryModal();
      handleRefresh();
    } catch (error) {
      alert('Failed to create journal entry. Please try again.');
    }
  };

  const handleAccountBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!accountBalanceForm.accountId) {
        alert('Please select an account');
        return;
      }

      const balance = await LedgerService.getAccountBalance(
        accountBalanceForm.accountId,
        accountBalanceForm.asOfDate,
      );

      const account = chartOfAccounts.find(
        (acc) => acc.id === accountBalanceForm.accountId,
      );
      alert(
        `Account Balance for ${account?.account_name}:\nAs of: ${accountBalanceForm.asOfDate}\nBalance: ${formatCurrency(balance.balance)}`,
      );
      closeAccountBalanceModal();
    } catch (error) {
      alert('Failed to get account balance. Please try again.');
    }
  };

  const handleFinancialReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!financialReportForm.reportType) {
        alert('Please select a report type');
        return;
      }

      let reportData;
      switch (financialReportForm.reportType) {
        case 'trial-balance':
          reportData = await LedgerService.getTrialBalance(
            financialReportForm.endDate,
          );
          alert(
            `Trial Balance Report\nAs of: ${financialReportForm.endDate}\nTotal Accounts: ${reportData.accounts.length}`,
          );
          break;
        case 'income-statement':
          reportData = await LedgerService.getIncomeStatement(
            financialReportForm.startDate,
            financialReportForm.endDate,
          );
          alert(
            `Income Statement Report\nPeriod: ${financialReportForm.startDate} to ${financialReportForm.endDate}\nNet Income: ${formatCurrency(reportData.net_income)}`,
          );
          break;
        case 'balance-sheet':
          reportData = await LedgerService.getBalanceSheet(
            financialReportForm.endDate,
          );
          alert(
            `Balance Sheet Report\nAs of: ${financialReportForm.endDate}\nTotal Assets: ${formatCurrency(reportData.assets.total)}`,
          );
          break;
        default:
          alert('Please select a valid report type');
          return;
      }

      closeFinancialReportModal();
    } catch (error) {
      alert('Failed to generate financial report. Please try again.');
    }
  };

  // Remove the old fetchLedgerData function since we're using parallel API calls now

  const calculateSummaryData = (
    accounts: ChartOfAccountsResponse[],
    income: IncomeStatementResponse | null,
    balance: BalanceSheetResponse | null,
  ) => {
    // Ensure accounts is an array
    if (!Array.isArray(accounts)) {
      accounts = [];
    }

    // Calculate totals from chart of accounts
    const assets = accounts.filter((acc) => acc.account_type === 'asset');
    const liabilities = accounts.filter(
      (acc) => acc.account_type === 'liability',
    );
    const equity = accounts.filter((acc) => acc.account_type === 'equity');
    const revenue = accounts.filter((acc) => acc.account_type === 'revenue');
    const expenses = accounts.filter((acc) => acc.account_type === 'expense');

    setTotalAssets(
      assets.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
    );
    setTotalLiabilities(
      liabilities.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
    );
    setTotalEquity(
      equity.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
    );
    setTotalRevenue(
      revenue.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
    );
    setTotalExpenses(
      expenses.reduce((sum, acc) => sum + (acc.current_balance || 0), 0),
    );

    // Use income statement data if available
    if (income) {
      setTotalRevenue(income.revenue);
      setTotalExpenses(income.expenses);
      setNetIncome(income.net_income);
    }

    // Use balance sheet data if available
    if (balance) {
      setTotalAssets(balance.assets.total);
      setTotalLiabilities(balance.liabilities.total);
      setTotalEquity(balance.equity.total);
    }
  };

  const getAccountTypeCount = (type: AccountType) => {
    if (!Array.isArray(chartOfAccounts)) return 0;
    return chartOfAccounts.filter((acc) => acc.account_type === type).length;
  };

  if (accountsLoading || transactionsLoading || budgetsLoading || trialBalanceLoading || incomeStatementLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading ledger data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Ledger
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRefresh} className="mr-2">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleReset} className="mr-2">
              Reset State
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Ledger
            </h1>
            <p className="text-gray-600">
              Complete financial management and accounting system
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
            <Button size="sm" onClick={handleNewTransaction}>
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.ASSET)} asset accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.LIABILITY)} liability accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue: {formatCurrency(totalRevenue)} | Expenses:{' '}
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Equity
              </CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalEquity)}
              </div>
              <p className="text-xs text-muted-foreground">
                {getAccountTypeCount(AccountType.EQUITY)} equity accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Financial Reports</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>
                    Latest financial transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(recentTransactions) &&
                      recentTransactions.slice(0, 5).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.transaction_number} •{' '}
                              {new Date(
                                transaction.transaction_date,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTransactionTypeLabel(
                                transaction.transaction_type as TransactionType,
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>

              {/* Account Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Account Distribution
                  </CardTitle>
                  <CardDescription>Chart of accounts by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(AccountType).map((type) => {
                      const count = getAccountTypeCount(type);
                      const total = chartOfAccounts.length;
                      const percentage =
                        total > 0 ? ((count / total) * 100).toFixed(1) : '0';

                      return (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${getAccountTypeColor(type).replace('text-', 'bg-')}`}
                            ></div>
                            <span className="font-medium">
                              {getAccountTypeLabel(type)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{count}</div>
                            <div className="text-sm text-gray-500">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleNewTransaction}
                  >
                    <Plus className="w-6 h-6 mb-2" />
                    New Transaction
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleJournalEntry}
                  >
                    <BookOpen className="w-6 h-6 mb-2" />
                    Journal Entry
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleAccountBalance}
                  >
                    <Calculator className="w-6 h-6 mb-2" />
                    Account Balance
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={handleFinancialReport}
                  >
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Financial Report
                  </Button>
                </div>

                {/* Show message when no accounts exist */}
                {chartOfAccounts.length === 0 && (
                  <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          No Chart of Accounts Found
                        </h3>
                        <p className="text-yellow-700 mb-4">
                          Your tenant was created but no default accounts were
                          set up. This usually happens when the automatic
                          seeding process fails.
                        </p>
                        <div className="flex space-x-3">
                          <Button
                            onClick={async () => {
                              try {
                                const testResult =
                                  await LedgerService.testSeedEndpoint();

                                if (testResult && testResult.success) {
                                  const result =
                                    await LedgerService.seedDefaultAccounts();

                                  if (result && result.success) {
                                    alert(
                                      `Success! Created ${result.created_accounts} default accounts. Please refresh the data.`,
                                    );
                                    handleRefresh();
                                  } else if (result && result.message) {
                                    alert(result.message);
                                  } else {
                                    alert(
                                      'Seeding completed but response format was unexpected. Please refresh the data.',
                                    );
                                    handleRefresh();
                                  }
                                } else {
                                  alert(
                                    'Simple endpoint test failed. Please check the console for details.',
                                  );
                                }
                              } catch (error) {
                                alert(
                                  'Failed to create default accounts. Please try again.',
                                );
                              }
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Default Accounts
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart of Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>
                  Complete list of financial accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Balance</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(chartOfAccounts) &&
                        chartOfAccounts.map((account) => (
                          <tr
                            key={account.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-2 font-mono">
                              {account.account_code}
                            </td>
                            <td className="p-2 font-medium">
                              {account.account_name}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className={getAccountTypeColor(
                                  account.account_type as AccountType,
                                )}
                              >
                                {getAccountTypeLabel(
                                  account.account_type as AccountType,
                                )}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm text-gray-600">
                              {account.account_category}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(account.current_balance)}
                            </td>
                            <td className="p-2 text-center">
                              <Badge
                                variant={
                                  account.is_active ? 'default' : 'secondary'
                                }
                              >
                                {account.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest financial transactions and journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(recentTransactions) &&
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {transaction.description}
                          </div>
                          <Badge variant="outline">
                            {getTransactionTypeLabel(
                              transaction.transaction_type as TransactionType,
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount:</span>{' '}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{' '}
                            {new Date(
                              transaction.transaction_date,
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Reference:</span>{' '}
                            {transaction.reference_number || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trial Balance */}
              <Card>
                <CardHeader>
                  <CardTitle>Trial Balance</CardTitle>
                  <CardDescription>
                    Account balances as of today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trialBalance ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        As of:{' '}
                        {new Date(trialBalance.as_of_date).toLocaleDateString()}
                      </div>
                      <div className="text-lg font-bold">
                        Total Debits:{' '}
                        {formatCurrency(
                          Array.isArray(trialBalance.accounts)
                            ? trialBalance.accounts.reduce(
                                (sum, acc) => sum + (acc.debit_balance || 0),
                                0,
                              )
                            : 0,
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        Total Credits:{' '}
                        {formatCurrency(
                          Array.isArray(trialBalance.accounts)
                            ? trialBalance.accounts.reduce(
                                (sum, acc) => sum + (acc.credit_balance || 0),
                                0,
                              )
                            : 0,
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No trial balance data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Income Statement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Income Statement</CardTitle>
                  <CardDescription>
                    Revenue and expenses summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeStatement ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(incomeStatement.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(incomeStatement.expenses)}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Net Income:</span>
                        <span
                          className={
                            incomeStatement.net_income >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(incomeStatement.net_income)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No income statement data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Budgets</CardTitle>
                <CardDescription>
                  Current budget allocations and spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(activeBudgets) &&
                    activeBudgets.map((budget) => (
                      <div key={budget.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {budget.budget_name}
                          </div>
                          <Badge variant="outline">{budget.budget_type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Budget:</span>{' '}
                            {formatCurrency(budget.total_budget)}
                          </div>
                          <div>
                            <span className="font-medium">Spent:</span>{' '}
                            {formatCurrency(budget.spent_amount)}
                          </div>
                          <div>
                            <span className="font-medium">Remaining:</span>{' '}
                            {formatCurrency(budget.remaining_amount)}
                          </div>
                          <div>
                            <span className="font-medium">Utilization:</span>{' '}
                            {(
                              (budget.spent_amount / budget.total_budget) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(budget.spent_amount / budget.total_budget) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Transaction Modal */}
        {showNewTransactionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Transaction</h3>
                <button
                  onClick={closeTransactionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction description"
                    value={transactionForm.description}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        amount: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={transactionForm.transactionDate}
                    onChange={(e) =>
                      setTransactionForm({
                        ...transactionForm,
                        transactionDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Debit Account
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={transactionForm.debitAccountId}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          debitAccountId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select account</option>
                      {chartOfAccounts.length > 0 ? (
                        chartOfAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No accounts available
                        </option>
                      )}
                    </select>
                    {chartOfAccounts.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No accounts found. Please create accounts first.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Account
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={transactionForm.creditAccountId}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          creditAccountId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select account</option>
                      {chartOfAccounts.length > 0 ? (
                        chartOfAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No accounts available
                        </option>
                      )}
                    </select>
                    {chartOfAccounts.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        No accounts found. Please create accounts first.
                      </p>
                    )}
                  </div>
                </div>

                {/* Show create account button when no accounts exist */}
                {chartOfAccounts.length === 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-3">
                      You need to create chart of accounts first before creating
                      transactions.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const result =
                            await LedgerService.seedDefaultAccounts();

                          if (result && result.success) {
                            alert(
                              `Success! Created ${result.created_accounts} default accounts. Please refresh the data.`,
                            );
                            setShowNewTransactionModal(false);
                            handleRefresh();
                          } else if (result && result.message) {
                            alert(result.message);
                          } else {
                            alert(
                              'Seeding completed but response format was unexpected. Please refresh the data.',
                            );
                            setShowNewTransactionModal(false);
                            handleRefresh();
                          }
                        } catch (error) {
                          alert(
                            'Failed to create default accounts. Please try again.',
                          );
                        }
                      }}
                    >
                      Create Accounts
                    </Button>
                  </div>
                )}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeTransactionModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Transaction
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Journal Entry Modal */}
        {showJournalEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Journal Entry</h3>
                <button
                  onClick={closeJournalEntryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleJournalEntrySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="JE-001"
                    value={journalEntryForm.entryNumber}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        entryNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Journal entry description"
                    value={journalEntryForm.description}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={journalEntryForm.entryDate}
                    onChange={(e) =>
                      setJournalEntryForm({
                        ...journalEntryForm,
                        entryDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeJournalEntryModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Entry
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Balance Modal */}
        {showAccountBalanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Check Account Balance</h3>
                <button
                  onClick={closeAccountBalanceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAccountBalanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accountBalanceForm.accountId}
                    onChange={(e) =>
                      setAccountBalanceForm({
                        ...accountBalanceForm,
                        accountId: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select account</option>
                    {chartOfAccounts.length > 0 ? (
                      chartOfAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No accounts available
                      </option>
                    )}
                  </select>
                  {chartOfAccounts.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No accounts found. Please create accounts first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    As of Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accountBalanceForm.asOfDate}
                    onChange={(e) =>
                      setAccountBalanceForm({
                        ...accountBalanceForm,
                        asOfDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeAccountBalanceModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Check Balance
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Financial Report Modal */}
        {showFinancialReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Generate Financial Report
                </h3>
                <button
                  onClick={closeFinancialReportModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={handleFinancialReportSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={financialReportForm.reportType}
                    onChange={(e) =>
                      setFinancialReportForm({
                        ...financialReportForm,
                        reportType: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select report type</option>
                    <option value="trial-balance">Trial Balance</option>
                    <option value="income-statement">Income Statement</option>
                    <option value="balance-sheet">Balance Sheet</option>
                    <option value="cash-flow">Cash Flow Statement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={financialReportForm.startDate}
                    onChange={(e) =>
                      setFinancialReportForm({
                        ...financialReportForm,
                        startDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={financialReportForm.endDate}
                    onChange={(e) =>
                      setFinancialReportForm({
                        ...financialReportForm,
                        endDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={closeFinancialReportModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Generate Report
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
