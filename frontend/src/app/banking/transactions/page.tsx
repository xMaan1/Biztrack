'use client';

import React, { useEffect, useState } from 'react';
import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import {
  Card,
  CardContent,
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
  TrendingUp,
  Plus,
  Search,
  Edit,
  Eye,
  RefreshCw,
  TrendingDown,
  Clock,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { bankingService } from '@/src/services/BankingService';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { formatDate } from '@/src/lib/utils';
import {
  BankTransaction,
  BankAccount,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  getPaymentMethodLabel,
} from '@/src/models/banking';
import { DashboardLayout } from '@/src/components/layout';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function BankTransactionsPage() {
  return (
    <ModuleGuard module="banking" fallback={<div>You don't have access to Banking module</div>}>
      <BankTransactionsContent />
    </ModuleGuard>
  );
}

function BankTransactionsContent() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<BankTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<BankTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    bank_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    value_date: '',
    transaction_type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    amount: 0,
    currency: 'USD',
    exchange_rate: 1.0,
    base_amount: 0,
    payment_method: PaymentMethod.CASH,
    reference_number: '',
    external_reference: '',
    check_number: '',
    description: '',
    memo: '',
    category: '',
    counterparty_name: '',
    counterparty_account: '',
    counterparty_bank: '',
    is_reconciled: false,
    related_invoice_id: '',
    related_purchase_order_id: '',
    related_expense_id: '',
    tags: [] as string[],
    notes: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    bank_account_id: '',
    transaction_date: '',
    value_date: '',
    transaction_type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    amount: 0,
    currency: 'USD',
    exchange_rate: 1.0,
    base_amount: 0,
    payment_method: PaymentMethod.CASH,
    reference_number: '',
    external_reference: '',
    check_number: '',
    description: '',
    memo: '',
    category: '',
    counterparty_name: '',
    counterparty_account: '',
    counterparty_bank: '',
    is_reconciled: false,
    related_invoice_id: '',
    related_purchase_order_id: '',
    related_expense_id: '',
    tags: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData] = await Promise.all([
        bankingService.getBankTransactions(),
        bankingService.getBankAccounts(true)
      ]);
      
      setTransactions(transactionsData || []);
      setBankAccounts(accountsData || []);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.bank_account_id) {
        toast.error('Please select a bank account');
        return;
      }
      if (!formData.transaction_date) {
        toast.error('Please select a transaction date');
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
      
      const transactionData = {
        bankAccountId: formData.bank_account_id,
        transactionDate: new Date(formData.transaction_date).toISOString(),
        valueDate: formData.value_date ? new Date(formData.value_date).toISOString() : undefined,
        transactionType: formData.transaction_type,
        status: formData.status,
        amount: formData.amount,
        currency: formData.currency,
        exchangeRate: formData.exchange_rate,
        baseAmount: formData.base_amount,
        paymentMethod: formData.payment_method,
        referenceNumber: formData.reference_number || undefined,
        externalReference: formData.external_reference || undefined,
        checkNumber: formData.check_number || undefined,
        description: formData.description,
        memo: formData.memo || undefined,
        category: formData.category || undefined,
        counterpartyName: formData.counterparty_name || undefined,
        counterpartyAccount: formData.counterparty_account || undefined,
        counterpartyBank: formData.counterparty_bank || undefined,
        isReconciled: formData.is_reconciled,
        relatedInvoiceId: formData.related_invoice_id || undefined,
        relatedPurchaseOrderId: formData.related_purchase_order_id || undefined,
        relatedExpenseId: formData.related_expense_id || undefined,
        tags: formData.tags,
        notes: formData.notes || undefined,
      };
      
      await bankingService.createBankTransaction(transactionData);
      toast.success('Transaction created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bank_account_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      value_date: '',
      transaction_type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      amount: 0,
      currency: 'USD',
      exchange_rate: 1.0,
      base_amount: 0,
      payment_method: PaymentMethod.CASH,
      reference_number: '',
      external_reference: '',
      check_number: '',
      description: '',
      memo: '',
      category: '',
      counterparty_name: '',
      counterparty_account: '',
    counterparty_bank: '',
    is_reconciled: false,
    related_invoice_id: '',
    related_purchase_order_id: '',
    related_expense_id: '',
    tags: [],
    notes: '',
    });
  };

  const openEditModal = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      bank_account_id: transaction.bankAccountId,
      transaction_date: new Date(transaction.transactionDate).toISOString().split('T')[0],
      value_date: transaction.valueDate ? new Date(transaction.valueDate).toISOString().split('T')[0] : '',
      transaction_type: transaction.transactionType,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      exchange_rate: transaction.exchangeRate,
      base_amount: transaction.baseAmount,
      payment_method: transaction.paymentMethod || PaymentMethod.CASH,
      reference_number: transaction.referenceNumber || '',
      external_reference: transaction.externalReference || '',
      check_number: transaction.checkNumber || '',
      description: transaction.description,
      memo: transaction.memo || '',
      category: transaction.category || '',
      counterparty_name: transaction.counterpartyName || '',
      counterparty_account: transaction.counterpartyAccount || '',
      counterparty_bank: transaction.counterpartyBank || '',
      is_reconciled: transaction.isReconciled,
      related_invoice_id: transaction.relatedInvoiceId || '',
      related_purchase_order_id: transaction.relatedPurchaseOrderId || '',
      related_expense_id: transaction.relatedExpenseId || '',
      tags: transaction.tags || [],
      notes: transaction.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!editFormData.bank_account_id) {
        toast.error('Please select a bank account');
        return;
      }
      if (!editFormData.transaction_date) {
        toast.error('Please select a transaction date');
        return;
      }
      if (!editFormData.description.trim()) {
        toast.error('Please enter a description');
        return;
      }
      if (editFormData.amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      const transactionData = {
        bankAccountId: editFormData.bank_account_id,
        transactionDate: new Date(editFormData.transaction_date).toISOString(),
        valueDate: editFormData.value_date ? new Date(editFormData.value_date).toISOString() : undefined,
        transactionType: editFormData.transaction_type,
        status: editFormData.status,
        amount: editFormData.amount,
        currency: editFormData.currency,
        exchangeRate: editFormData.exchange_rate,
        baseAmount: editFormData.base_amount,
        paymentMethod: editFormData.payment_method,
        referenceNumber: editFormData.reference_number || undefined,
        externalReference: editFormData.external_reference || undefined,
        checkNumber: editFormData.check_number || undefined,
        description: editFormData.description,
        memo: editFormData.memo || undefined,
        category: editFormData.category || undefined,
        counterpartyName: editFormData.counterparty_name || undefined,
        counterpartyAccount: editFormData.counterparty_account || undefined,
        counterpartyBank: editFormData.counterparty_bank || undefined,
        isReconciled: editFormData.is_reconciled,
        relatedInvoiceId: editFormData.related_invoice_id || undefined,
        relatedPurchaseOrderId: editFormData.related_purchase_order_id || undefined,
        relatedExpenseId: editFormData.related_expense_id || undefined,
        tags: editFormData.tags,
        notes: editFormData.notes || undefined,
      };
      
      await bankingService.updateBankTransaction(editingTransaction.id, transactionData);
      toast.success('Transaction updated successfully');
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (transaction: BankTransaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      setIsDeleting(true);
      await bankingService.deleteBankTransaction(deletingTransaction.id);
      toast.success('Transaction deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete transaction'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReconcileTransaction = async (transactionId: string) => {
    try {
      await bankingService.reconcileTransactionSimple(transactionId, 'Reconciled from transactions page');
      toast.success('Transaction reconciled successfully');
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to reconcile transaction'));
    }
  };

  const handleUnreconcileTransaction = async (transactionId: string) => {
    try {
      await bankingService.unreconcileTransaction(transactionId);
      toast.success('Transaction unreconciled successfully');
      loadData();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to unreconcile transaction'));
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

  const filteredTransactions = (transactions || []).filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.counterpartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.referenceNumber?.includes(searchTerm) ||
                         transaction.transactionNumber.includes(searchTerm);
    
    const matchesAccount = selectedAccount === 'all' || transaction.bankAccountId === selectedAccount;
    const matchesType = selectedType === 'all' || transaction.transactionType === selectedType;
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;

    return matchesSearch && matchesAccount && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
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
            <h1 className="text-3xl font-bold">Bank Transactions</h1>
            <p className="text-muted-foreground">
              Track and manage all bank transactions
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(TransactionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTransactionTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(TransactionStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getTransactionStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reconciled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDate(transaction.transactionDate)}
                        </div>
                        {transaction.valueDate && (
                          <div className="text-sm text-muted-foreground">
                            Value: {formatDate(transaction.valueDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span>{getTransactionTypeLabel(transaction.transactionType)}</span>
                      </div>
                      {transaction.paymentMethod && (
                        <div className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">
                          {transaction.description}
                        </div>
                        {transaction.referenceNumber && (
                          <div className="text-sm text-muted-foreground">
                            Ref: {transaction.referenceNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.counterpartyName && (
                        <div>
                          <div className="font-medium">
                            {transaction.counterpartyName}
                          </div>
                          {transaction.counterpartyAccount && (
                            <div className="text-sm text-muted-foreground">
                              {transaction.counterpartyAccount}
                            </div>
                          )}
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
                      <div className="flex items-center space-x-2">
                        {transaction.isReconciled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm">
                          {transaction.isReconciled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {transaction.isReconciled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnreconcileTransaction(transaction.id)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Unreconcile"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconcileTransaction(transaction.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Reconcile"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(transaction)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Transaction Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bank Transaction</DialogTitle>
              <DialogDescription>
                Record a new bank transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Bank Account *</Label>
                  <Select
                    value={formData.bank_account_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} - {account.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Transaction Date *</Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value as TransactionType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TransactionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTransactionTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TransactionStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TransactionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getTransactionStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        amount,
                        base_amount: amount * prev.exchange_rate
                      }));
                    }}
                    placeholder="0.00"
                  />
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

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="counterpartyName">Counterparty Name</Label>
                  <Input
                    id="counterpartyName"
                    value={formData.counterparty_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, counterparty_name: e.target.value }))}
                    placeholder="Who is this transaction with?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Transaction reference"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo</Label>
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="Additional notes"
                  rows={3}
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                View detailed information about this transaction.
              </DialogDescription>
            </DialogHeader>

            {viewingTransaction && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction Number</Label>
                    <p className="text-sm font-medium">{viewingTransaction.transactionNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(viewingTransaction.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction Date</Label>
                    <p className="text-sm">{formatDate(viewingTransaction.transactionDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Value Date</Label>
                    <p className="text-sm">{viewingTransaction.valueDate ? formatDate(viewingTransaction.valueDate) : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTransactionIcon(viewingTransaction.transactionType)}
                      <span className="text-sm">{getTransactionTypeLabel(viewingTransaction.transactionType)}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                    <p className="text-sm">{viewingTransaction.paymentMethod ? getPaymentMethodLabel(viewingTransaction.paymentMethod) : 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{viewingTransaction.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <p className={`text-sm font-medium ${
                      viewingTransaction.transactionType === TransactionType.DEPOSIT ||
                      viewingTransaction.transactionType === TransactionType.TRANSFER_IN ||
                      viewingTransaction.transactionType === TransactionType.REFUND ||
                      viewingTransaction.transactionType === TransactionType.INTEREST
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {viewingTransaction.transactionType === TransactionType.DEPOSIT ||
                       viewingTransaction.transactionType === TransactionType.TRANSFER_IN ||
                       viewingTransaction.transactionType === TransactionType.REFUND ||
                       viewingTransaction.transactionType === TransactionType.INTEREST
                         ? '+'
                         : '-'
                      }{formatCurrency(viewingTransaction.baseAmount)} {viewingTransaction.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Base Amount</Label>
                    <p className="text-sm">{formatCurrency(viewingTransaction.baseAmount)}</p>
                  </div>
                </div>


                {viewingTransaction.counterpartyName && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Counterparty</Label>
                    <div>
                      <p className="text-sm font-medium">{viewingTransaction.counterpartyName}</p>
                      {viewingTransaction.counterpartyAccount && (
                        <p className="text-sm text-muted-foreground">{viewingTransaction.counterpartyAccount}</p>
                      )}
                      {viewingTransaction.counterpartyBank && (
                        <p className="text-sm text-muted-foreground">{viewingTransaction.counterpartyBank}</p>
                      )}
                    </div>
                  </div>
                )}

                {viewingTransaction.referenceNumber && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reference Number</Label>
                    <p className="text-sm">{viewingTransaction.referenceNumber}</p>
                  </div>
                )}

                {viewingTransaction.memo && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Memo</Label>
                    <p className="text-sm">{viewingTransaction.memo}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reconciled</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {viewingTransaction.isReconciled ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {viewingTransaction.isReconciled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-sm">{formatDate(viewingTransaction.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{formatDate(viewingTransaction.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingTransaction(null)}>
                Close
              </Button>
              <Button onClick={() => {
                if (viewingTransaction) {
                  setViewingTransaction(null);
                  openEditModal(viewingTransaction);
                }
              }}>
                Edit Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Transaction Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bank Transaction</DialogTitle>
              <DialogDescription>
                Update the transaction details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-bankAccountId">Bank Account *</Label>
                  <Select
                    value={editFormData.bank_account_id}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, bank_account_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} - {account.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-transactionDate">Transaction Date *</Label>
                  <Input
                    id="edit-transactionDate"
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-transactionType">Transaction Type *</Label>
                  <Select
                    value={editFormData.transaction_type}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, transaction_type: value as TransactionType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TransactionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTransactionTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as TransactionStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TransactionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getTransactionStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setEditFormData(prev => ({
                        ...prev,
                        amount,
                        base_amount: amount * prev.exchange_rate
                      }));
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select
                    value={editFormData.currency}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, currency: value }))}
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

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-counterpartyName">Counterparty Name</Label>
                  <Input
                    id="edit-counterpartyName"
                    value={editFormData.counterparty_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, counterparty_name: e.target.value }))}
                    placeholder="Who is this transaction with?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-referenceNumber">Reference Number</Label>
                  <Input
                    id="edit-referenceNumber"
                    value={editFormData.reference_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Transaction reference"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-memo">Memo</Label>
                <Textarea
                  id="edit-memo"
                  value={editFormData.memo}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTransaction} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {deletingTransaction && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-sm text-gray-600">{deletingTransaction.description}</p>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <p className="text-sm text-gray-600">
                        {deletingTransaction.transactionType === TransactionType.DEPOSIT ||
                         deletingTransaction.transactionType === TransactionType.TRANSFER_IN ||
                         deletingTransaction.transactionType === TransactionType.REFUND ||
                         deletingTransaction.transactionType === TransactionType.INTEREST
                           ? '+'
                           : '-'
                        }{formatCurrency(deletingTransaction.baseAmount)} {deletingTransaction.currency}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-sm text-gray-600">{formatDate(deletingTransaction.transactionDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingTransaction(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteTransaction}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


