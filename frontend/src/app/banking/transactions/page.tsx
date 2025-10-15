'use client';

import React, { useEffect, useState } from 'react';
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
  DollarSign,
  Plus,
  Search,
  Edit,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
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

export default function BankTransactionsPage() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    bankAccountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    valueDate: '',
    transactionType: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    amount: 0,
    currency: 'USD',
    exchangeRate: 1.0,
    baseAmount: 0,
    paymentMethod: PaymentMethod.CASH,
    referenceNumber: '',
    externalReference: '',
    checkNumber: '',
    description: '',
    memo: '',
    category: '',
    counterpartyName: '',
    counterpartyAccount: '',
    counterpartyBank: '',
    isOnlineTransaction: false,
    onlineTransactionId: '',
    processingFee: 0,
    isReconciled: false,
    relatedInvoiceId: '',
    relatedPurchaseOrderId: '',
    relatedExpenseId: '',
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
      
      setTransactions(transactionsData);
      setBankAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      setIsSubmitting(true);
      await bankingService.createBankTransaction(formData);
      toast.success('Transaction created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      toast.error('Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankAccountId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      valueDate: '',
      transactionType: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      amount: 0,
      currency: 'USD',
      exchangeRate: 1.0,
      baseAmount: 0,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: '',
      externalReference: '',
      checkNumber: '',
      description: '',
      memo: '',
      category: '',
      counterpartyName: '',
      counterpartyAccount: '',
      counterpartyBank: '',
      isOnlineTransaction: false,
      onlineTransactionId: '',
      processingFee: 0,
      isReconciled: false,
      relatedInvoiceId: '',
      relatedPurchaseOrderId: '',
      relatedExpenseId: '',
      tags: [],
      notes: '',
    });
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
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
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
                      {transaction.processingFee > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Fee: {formatCurrency(transaction.processingFee)}
                        </div>
                      )}
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
                          onClick={() => router.push(`/banking/transactions/${transaction.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/banking/transactions/${transaction.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
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
                    value={formData.bankAccountId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
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
                    value={formData.transactionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type *</Label>
                  <Select
                    value={formData.transactionType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value as TransactionType }))}
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
                        baseAmount: amount * prev.exchangeRate
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
                    value={formData.counterpartyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, counterpartyName: e.target.value }))}
                    placeholder="Who is this transaction with?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
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
      </div>
    </DashboardLayout>
  );
}
