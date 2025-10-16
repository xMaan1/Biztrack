'use client';

import React, { useEffect, useState } from 'react';
import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { bankingService } from '@/src/services/BankingService';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { formatDate } from '@/src/lib/utils';
import {
  BankingDashboard as BankingDashboardType,
  BankAccount,
  BankAccountCreate,
  BankTransaction,
  TransactionType,
  TransactionStatus,
  BankAccountType,
  getTransactionTypeLabel,
  getAccountTypeLabel,
} from '@/src/models/banking';
import { DashboardLayout } from '@/src/components/layout';
import { toast } from 'sonner';

export default function BankingDashboard() {
  return (
    <ModuleGuard module="banking" fallback={<div>You don't have access to Banking module</div>}>
      <BankingDashboardContent />
    </ModuleGuard>
  );
}

function BankingDashboardContent() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<BankingDashboardType | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountCreate>({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    bankCode: '',
    accountType: BankAccountType.CHECKING,
    currency: 'USD',
    currentBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    isActive: true,
    isPrimary: false,
    supportsOnlineBanking: false,
    description: '',
    tags: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[BANKING DEBUG] Loading dashboard data...');
      
      const [dashboard, accounts] = await Promise.all([
        bankingService.getBankingDashboard(),
        bankingService.getBankAccounts(true)
      ]);
      
      console.log('[BANKING DEBUG] Dashboard data:', dashboard);
      console.log('[BANKING DEBUG] Bank accounts:', accounts);
      
      setDashboardData(dashboard);
      setBankAccounts(accounts || []);
      setRecentTransactions(dashboard?.recentTransactions || []);
    } catch (error) {
      console.error('[BANKING DEBUG] Failed to load banking dashboard:', error);
      toast.error('Failed to load banking dashboard');
      // Set default values on error
      setBankAccounts([]);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      bankCode: '',
      accountType: BankAccountType.CHECKING,
      currency: 'USD',
      currentBalance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      isActive: true,
      isPrimary: false,
      supportsOnlineBanking: false,
      description: '',
      tags: [],
    });
  };

  const handleCreateAccount = async () => {
    try {
      setSubmitting(true);
      console.log('[BANKING DEBUG] Creating account with form data:', formData);
      
      const createdAccount = await bankingService.createBankAccount(formData);
      console.log('[BANKING DEBUG] Created account:', createdAccount);
      
      toast.success('Bank account created successfully!');
      setShowCreateModal(false);
      resetForm();
      await loadDashboardData(); // Refresh the data
    } catch (error) {
      console.error('[BANKING DEBUG] Failed to create bank account:', error);
      toast.error('Failed to create bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig = {
      [TransactionStatus.PENDING]: { variant: 'secondary', label: 'Pending' },
      [TransactionStatus.PROCESSING]: { variant: 'default', label: 'Processing' },
      [TransactionStatus.COMPLETED]: { variant: 'default', label: 'Completed' },
      [TransactionStatus.FAILED]: { variant: 'destructive', label: 'Failed' },
      [TransactionStatus.CANCELLED]: { variant: 'outline', label: 'Cancelled' },
      [TransactionStatus.REVERSED]: { variant: 'outline', label: 'Reversed' },
    };

    const config = statusConfig[status] || statusConfig[TransactionStatus.PENDING];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.TRANSFER_IN:
      case TransactionType.REFUND:
      case TransactionType.INTEREST:
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case TransactionType.WITHDRAWAL:
      case TransactionType.TRANSFER_OUT:
      case TransactionType.PAYMENT:
      case TransactionType.FEE:
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading banking dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banking Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your bank accounts, transactions, and cash position
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bank Balance</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.totalBankBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.totalAvailableBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.totalPendingBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Processing transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(dashboardData?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashboardData?.netCashFlow || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today's flow
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.outstandingReceivables || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Money owed to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.outstandingPayables || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Money you owe
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(bankAccounts || []).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{account.accountName || 'Unnamed Account'}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.bankName || 'Unknown Bank'} • {account.accountNumber ? account.accountNumber.slice(-4) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{account.accountType}</Badge>
                    {account.isPrimary && (
                      <Badge variant="default">Primary</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(account.currentBalance || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Available: {formatCurrency(account.availableBalance || 0)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingAccount(account)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button
                variant="outline"
                onClick={() => router.push('/banking/transactions')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentTransactions || []).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span>{getTransactionTypeLabel(transaction.transactionType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {transaction.description}
                      </div>
                      {transaction.counterpartyName && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.counterpartyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${
                        transaction.transactionType === TransactionType.DEPOSIT ||
                        transaction.transactionType === TransactionType.TRANSFER_IN ||
                        transaction.transactionType === TransactionType.REFUND ||
                        transaction.transactionType === TransactionType.INTEREST
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.transactionType === TransactionType.DEPOSIT ||
                         transaction.transactionType === TransactionType.TRANSFER_IN ||
                         transaction.transactionType === TransactionType.REFUND ||
                         transaction.transactionType === TransactionType.INTEREST
                          ? '+'
                          : '-'
                        }{formatCurrency(transaction.baseAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/banking/transactions/${transaction.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Bank Account Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Create a new bank account to track your finances.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g., Main Business Account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Account number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g., Chase Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                    placeholder="9-digit routing number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value as BankAccountType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BankAccountType.CHECKING}>Checking</SelectItem>
                      <SelectItem value={BankAccountType.SAVINGS}>Savings</SelectItem>
                      <SelectItem value={BankAccountType.BUSINESS}>Business</SelectItem>
                      <SelectItem value={BankAccountType.CREDIT_LINE}>Credit Line</SelectItem>
                      <SelectItem value={BankAccountType.MONEY_MARKET}>Money Market</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableBalance">Available Balance</Label>
                  <Input
                    id="availableBalance"
                    type="number"
                    step="0.01"
                    value={formData.availableBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, availableBalance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pendingBalance">Pending Balance</Label>
                  <Input
                    id="pendingBalance"
                    type="number"
                    step="0.01"
                    value={formData.pendingBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, pendingBalance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes about this account"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPrimary">Primary Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="supportsOnlineBanking"
                    checked={formData.supportsOnlineBanking}
                    onChange={(e) => setFormData(prev => ({ ...prev, supportsOnlineBanking: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="supportsOnlineBanking">Supports Online Banking</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Bank Account Modal */}
        <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Bank Account Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the bank account
              </DialogDescription>
            </DialogHeader>

            {viewingAccount && (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Account Name</Label>
                      <p className="text-lg font-semibold">{viewingAccount.accountName || 'Unnamed Account'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bank Name</Label>
                      <p className="text-lg font-semibold">{viewingAccount.bankName || 'Unknown Bank'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                      <p className="text-lg font-mono">****{viewingAccount.accountNumber?.slice(-4) || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Account Type</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{getAccountTypeLabel(viewingAccount.accountType)}</Badge>
                      </div>
                    </div>
                  </div>

                  {viewingAccount.routingNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Routing Number</Label>
                      <p className="text-lg font-mono">{viewingAccount.routingNumber}</p>
                    </div>
                  )}

                  {viewingAccount.bankCode && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Bank Code</Label>
                      <p className="text-lg font-mono">{viewingAccount.bankCode}</p>
                    </div>
                  )}

                  {/* Balance Information */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Balance Information</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Current Balance</Label>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(viewingAccount.currentBalance || 0)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Available Balance</Label>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(viewingAccount.availableBalance || 0)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Pending Balance</Label>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(viewingAccount.pendingBalance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Settings */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Currency</Label>
                        <p className="text-lg">{viewingAccount.currency || 'USD'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <div className="mt-1">
                          <Badge variant={viewingAccount.isActive ? "default" : "secondary"}>
                            {viewingAccount.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Primary Account</Label>
                        <div className="mt-1">
                          <Badge variant={viewingAccount.isPrimary ? "default" : "outline"}>
                            {viewingAccount.isPrimary ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Online Banking</Label>
                        <div className="mt-1">
                          <Badge variant={viewingAccount.supportsOnlineBanking ? "default" : "outline"}>
                            {viewingAccount.supportsOnlineBanking ? 'Supported' : 'Not Supported'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingAccount.description && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-gray-900 mt-1">{viewingAccount.description}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {viewingAccount.tags && viewingAccount.tags.length > 0 && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium text-gray-600">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {viewingAccount.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Account ID</Label>
                        <p className="text-sm font-mono text-gray-500">{viewingAccount.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Created</Label>
                        <p className="text-sm text-gray-500">{formatDate(viewingAccount.createdAt)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                        <p className="text-sm text-gray-500">{formatDate(viewingAccount.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setViewingAccount(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setViewingAccount(null);
                router.push('/banking/accounts');
              }}>
                Manage Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
