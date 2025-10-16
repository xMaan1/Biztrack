'use client';

import React, { useState, useMemo } from 'react';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Receipt,
  Plus,
  Search,
  Edit,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Trash2,
  Filter,
  Calendar,
  Download,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { LedgerService } from '@/src/services/ledgerService';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { formatDate } from '@/src/lib/utils';
import {
  LedgerTransactionResponse,
  LedgerTransactionCreate,
  TransactionType,
  TransactionStatus,
  getTransactionTypeLabel,
  ChartOfAccountsResponse,
} from '@/src/models/ledger';
import { DashboardLayout } from '@/src/components/layout';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import { useCachedApi } from '@/src/hooks/useCachedApi';

export default function LedgerTransactionsPage() {
  return (
    <ModuleGuard module="finance" fallback={<div>You don't have access to Finance module</div>}>
      <LedgerTransactionsContent />
    </ModuleGuard>
  );
}

function LedgerTransactionsContent() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<LedgerTransactionResponse | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<LedgerTransactionResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<LedgerTransactionResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: TransactionType.INCOME,
    debit_account_id: '',
    credit_account_id: '',
    amount: 0,
    currency: 'USD',
    reference_number: '',
    description: '',
    notes: '',
    tags: [] as string[],
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    transaction_date: '',
    transaction_type: TransactionType.INCOME,
    debit_account_id: '',
    credit_account_id: '',
    amount: 0,
    currency: 'USD',
    reference_number: '',
    description: '',
    notes: '',
    tags: [] as string[],
  });

  // Fetch transactions with caching
  const { data: transactions, loading, refetch } = useCachedApi<LedgerTransactionResponse[]>(
    `ledger_transactions_${selectedType}_${selectedStatus}_${selectedAccount}_${dateFrom}_${dateTo}`,
    () => LedgerService.getLedgerTransactions(
      0,
      1000,
      selectedType === 'all' ? undefined : selectedType as TransactionType,
      selectedAccount === 'all' ? undefined : selectedAccount,
      dateFrom || undefined,
      dateTo || undefined
    ),
    { ttl: 300000 } // 5 minutes cache
  );

  // Get chart of accounts for account selection
  const { data: accounts } = useCachedApi<ChartOfAccountsResponse[]>(
    'chart_of_accounts',
    () => LedgerService.getChartOfAccounts(),
    { ttl: 600000 } // 10 minutes cache
  );

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case TransactionType.INCOME:
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case TransactionType.EXPENSE:
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case TransactionType.TRANSFER:
        return <Receipt className="h-4 w-4 text-blue-600" />;
      case TransactionType.ADJUSTMENT:
        return <CheckCircle className="h-4 w-4 text-yellow-600" />;
      case TransactionType.REFUND:
        return <Receipt className="h-4 w-4 text-purple-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'default';
      case TransactionStatus.PENDING:
        return 'secondary';
      case TransactionStatus.CANCELLED:
        return 'destructive';
      case TransactionStatus.FAILED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || transaction.transaction_type === selectedType;
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      const matchesAccount = selectedAccount === 'all' || 
                           transaction.account_id === selectedAccount || 
                           transaction.contra_account_id === selectedAccount;

      return matchesSearch && matchesType && matchesStatus && matchesAccount;
    });
  }, [transactions, searchTerm, selectedType, selectedStatus, selectedAccount]);

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.debit_account_id || !formData.credit_account_id) {
        toast.error('Please select both debit and credit accounts');
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error('Please enter a description');
        return;
      }
      
      if (formData.amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      // Transform data to match backend expectations
      const transactionData: LedgerTransactionCreate = {
        transaction_date: new Date(formData.transaction_date).toISOString(),
        transaction_type: formData.transaction_type,
        amount: formData.amount,
        description: formData.description,
        reference_number: formData.reference_number || undefined,
        account_id: formData.debit_account_id,
        contra_account_id: formData.credit_account_id,
        status: 'pending',
        meta_data: {
          currency: formData.currency,
          notes: formData.notes,
          tags: formData.tags
        }
      };
      
      await LedgerService.createLedgerTransaction(transactionData);
      toast.success('Transaction created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: TransactionType.INCOME,
        debit_account_id: '',
        credit_account_id: '',
        amount: 0,
        currency: 'USD',
        reference_number: '',
        description: '',
        notes: '',
        tags: [],
      });
      refetch();
    } catch (error) {
      console.error('Transaction creation error:', error);
      toast.error('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;
    
    try {
      setIsSubmitting(true);
      toast.error('Transaction editing is not yet implemented in the backend.');
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Transaction update error:', error);
      toast.error('Failed to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    
    try {
      setIsDeleting(true);
      toast.error('Transaction deletion is not yet implemented in the backend.');
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      toast.error('Failed to delete transaction. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (transaction: LedgerTransactionResponse) => {
    setEditingTransaction(transaction);
    setEditFormData({
      transaction_date: transaction.transaction_date,
      transaction_type: transaction.transaction_type as TransactionType,
      debit_account_id: transaction.account_id,
      credit_account_id: transaction.contra_account_id,
      amount: transaction.amount,
      currency: transaction.meta_data?.currency || 'USD',
      reference_number: transaction.reference_number || '',
      description: transaction.description,
      notes: transaction.meta_data?.notes || '',
      tags: transaction.meta_data?.tags || [],
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (transaction: LedgerTransactionResponse) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleExport = () => {
    if (!filteredTransactions.length) {
      toast.error('No transactions to export');
      return;
    }

    const csvContent = [
      ['Transaction Number', 'Date', 'Type', 'Description', 'Debit Account', 'Credit Account', 'Amount', 'Status', 'Reference'],
      ...filteredTransactions.map(t => [
        t.transaction_number,
        formatDate(t.transaction_date),
        getTransactionTypeLabel(t.transaction_type as TransactionType),
        t.description,
        t.account_id,
        t.contra_account_id,
        formatCurrency(t.amount),
        t.status,
        t.reference_number || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading transactions...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ledger Transactions</h1>
            <p className="text-muted-foreground">
              Manage and view all general ledger transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTransactions.filter(t => t.status === TransactionStatus.PENDING).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredTransactions.filter(t => t.status === TransactionStatus.COMPLETED).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                    <SelectItem value={TransactionType.TRANSFER}>Transfer</SelectItem>
                    <SelectItem value={TransactionType.ADJUSTMENT}>Adjustment</SelectItem>
                    <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value={TransactionStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={TransactionStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={TransactionStatus.CANCELLED}>Cancelled</SelectItem>
                    <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.account_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">From Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">To Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debit Account</TableHead>
                  <TableHead>Credit Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        {getTransactionTypeLabel(transaction.transaction_type as TransactionType)}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      {accounts?.find(acc => acc.id === transaction.account_id)?.account_name || transaction.account_id}
                    </TableCell>
                    <TableCell>
                      {accounts?.find(acc => acc.id === transaction.contra_account_id)?.account_name || transaction.contra_account_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status) as any}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(transaction)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Transaction Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
              <DialogDescription>
                Add a new transaction to the general ledger.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Transaction Date</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Transaction Type</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => setFormData({ ...formData, transaction_type: value as TransactionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                      <SelectItem value={TransactionType.TRANSFER}>Transfer</SelectItem>
                      <SelectItem value={TransactionType.ADJUSTMENT}>Adjustment</SelectItem>
                      <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter transaction description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debit_account">Debit Account</Label>
                  <Select
                    value={formData.debit_account_id}
                    onValueChange={(value) => setFormData({ ...formData, debit_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select debit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_account">Credit Account</Label>
                  <Select
                    value={formData.credit_account_id}
                    onValueChange={(value) => setFormData({ ...formData, credit_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="Optional reference number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransaction} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Transaction Modal */}
        <Dialog open={!!viewingTransaction} onOpenChange={() => setViewingTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                View transaction information and details.
              </DialogDescription>
            </DialogHeader>
            {viewingTransaction && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Transaction Number</Label>
                    <p className="text-sm">{viewingTransaction.transaction_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <p className="text-sm">{formatDate(viewingTransaction.transaction_date)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm">{getTransactionTypeLabel(viewingTransaction.transaction_type as TransactionType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={getStatusColor(viewingTransaction.status) as any}>
                      {viewingTransaction.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{viewingTransaction.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Debit Account</Label>
                    <p className="text-sm">
                      {accounts?.find(acc => acc.id === viewingTransaction.account_id)?.account_name || viewingTransaction.account_id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Credit Account</Label>
                    <p className="text-sm">
                      {accounts?.find(acc => acc.id === viewingTransaction.contra_account_id)?.account_name || viewingTransaction.contra_account_id}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm font-medium">{formatCurrency(viewingTransaction.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Currency</Label>
                    <p className="text-sm">{viewingTransaction.meta_data?.currency || 'USD'}</p>
                  </div>
                </div>
                
                {viewingTransaction.reference_number && (
                  <div>
                    <Label className="text-sm font-medium">Reference Number</Label>
                    <p className="text-sm">{viewingTransaction.reference_number}</p>
                  </div>
                )}
                
                {viewingTransaction.meta_data?.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm">{viewingTransaction.meta_data.notes}</p>
                  </div>
                )}
                
                {viewingTransaction.meta_data?.tags && viewingTransaction.meta_data.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingTransaction.meta_data.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingTransaction(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Transaction Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update transaction information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_transaction_date">Transaction Date</Label>
                  <Input
                    id="edit_transaction_date"
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => setEditFormData({ ...editFormData, transaction_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_transaction_type">Transaction Type</Label>
                  <Select
                    value={editFormData.transaction_type}
                    onValueChange={(value) => setEditFormData({ ...editFormData, transaction_type: value as TransactionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                      <SelectItem value={TransactionType.TRANSFER}>Transfer</SelectItem>
                      <SelectItem value={TransactionType.ADJUSTMENT}>Adjustment</SelectItem>
                      <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Enter transaction description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_debit_account">Debit Account</Label>
                  <Select
                    value={editFormData.debit_account_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, debit_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select debit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_credit_account">Credit Account</Label>
                  <Select
                    value={editFormData.credit_account_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, credit_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} ({account.account_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_amount">Amount</Label>
                  <Input
                    id="edit_amount"
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_reference_number">Reference Number</Label>
                  <Input
                    id="edit_reference_number"
                    value={editFormData.reference_number}
                    onChange={(e) => setEditFormData({ ...editFormData, reference_number: e.target.value })}
                    placeholder="Optional reference number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTransaction} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Transaction Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deletingTransaction && (
              <div className="py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium">{deletingTransaction.transaction_number}</p>
                  <p className="text-sm text-muted-foreground">{deletingTransaction.description}</p>
                  <p className="text-sm font-medium">{formatCurrency(deletingTransaction.amount)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTransaction} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
