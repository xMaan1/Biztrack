'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Plus, Eye } from 'lucide-react';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { toast } from 'sonner';
import { tillService } from '@/src/services/TillService';
import { bankingService } from '@/src/services/BankingService';
import type { Till, TillCreate, TillTransaction, TillTransactionCreate, TillTransactionType, BankAccount } from '@/src/models/banking';
import { getTillTransactionTypeLabel, getTillTransactionTypeColor } from '@/src/models/banking';
import { formatDate } from '@/src/lib/utils';

interface TillManagementProps {
  tills: Till[];
  onRefresh: () => void;
}

export function TillManagement({ tills, onRefresh }: TillManagementProps) {
  const { formatCurrency } = useCurrency();
  const [selectedTill, setSelectedTill] = useState<Till | null>(null);
  const [transactions, setTransactions] = useState<TillTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showCreateTillModal, setShowCreateTillModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  React.useEffect(() => {
    loadBankAccounts();
  }, []);
  
  const loadBankAccounts = async () => {
    try {
      const accounts = await bankingService.getBankAccounts(true);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    }
  };
  
  const [tillFormData, setTillFormData] = useState<TillCreate>({
    name: '',
    location: '',
    initialBalance: 0,
    currency: 'USD',
    description: '',
  });

  const [transactionFormData, setTransactionFormData] = useState<TillTransactionCreate>({
    tillId: '',
    bankAccountId: undefined,
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: 'deposit' as TillTransactionType,
    amount: 0,
    currency: 'USD',
    description: '',
    reason: '',
    referenceNumber: '',
    notes: '',
  });

  const handleCreateTill = async () => {
    try {
      setLoading(true);
      await tillService.createTill(tillFormData);
      toast.success('Till created successfully');
      setShowCreateTillModal(false);
      setTillFormData({
        name: '',
        location: '',
        initialBalance: 0,
        currency: 'USD',
        description: '',
      });
      onRefresh();
    } catch (error) {
      toast.error('Failed to create till');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = async (till: Till) => {
    try {
      setLoading(true);
      setSelectedTill(till);
      const trans = await tillService.getTillTransactions(till.id);
      setTransactions(trans);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedTill) return;

    try {
      setLoading(true);
      await tillService.createTillTransaction({
        ...transactionFormData,
        tillId: selectedTill.id,
      });
      toast.success('Transaction created successfully');
      setShowTransactionModal(false);
      setTransactionFormData({
        tillId: selectedTill.id,
        bankAccountId: undefined,
        transactionDate: new Date().toISOString().split('T')[0],
        transactionType: 'deposit' as TillTransactionType,
        amount: 0,
        currency: 'USD',
        description: '',
        reason: '',
        referenceNumber: '',
        notes: '',
      });
      await handleViewTransactions(selectedTill);
      onRefresh();
    } catch (error) {
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Till Management</h2>
          <p className="text-muted-foreground">Manage physical cash in the office</p>
        </div>
        <Button onClick={() => setShowCreateTillModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Till
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tills.map((till) => (
          <Card key={till.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{till.name}</CardTitle>
                {till.isActive ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Balance:</span>
                  <span className="text-xl font-bold">{formatCurrency(till.currentBalance)}</span>
                </div>
                {till.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="text-sm">{till.location}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewTransactions(till)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateTillModal} onOpenChange={setShowCreateTillModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Till</DialogTitle>
            <DialogDescription>Create a new till for managing physical cash</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Till Name *</Label>
              <Input
                id="name"
                value={tillFormData.name}
                onChange={(e) => setTillFormData({ ...tillFormData, name: e.target.value })}
                placeholder="e.g., Main Office Drawer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={tillFormData.location}
                onChange={(e) => setTillFormData({ ...tillFormData, location: e.target.value })}
                placeholder="e.g., Office Reception"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initialBalance">Initial Balance</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={tillFormData.initialBalance}
                onChange={(e) => setTillFormData({ ...tillFormData, initialBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={tillFormData.description}
                onChange={(e) => setTillFormData({ ...tillFormData, description: e.target.value })}
                placeholder="Add any notes about this till"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTillModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTill} disabled={loading}>Create Till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedTill !== null} onOpenChange={() => setSelectedTill(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transactions - {selectedTill?.name}</DialogTitle>
            <DialogDescription>Current Balance: {formatCurrency(selectedTill?.currentBalance || 0)}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowTransactionModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Running Balance</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Bank Balance</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.transactionDate)}</TableCell>
                      <TableCell>
                        <Badge className={getTillTransactionTypeColor(t.transactionType)}>
                          {getTillTransactionTypeLabel(t.transactionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className={t.transactionType === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {t.transactionType === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.runningBalance)}</TableCell>
                      <TableCell>
                        {t.bankAccount ? (
                          <span className="text-sm">{t.bankAccount.accountName || t.bankAccount.bankName}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.bankAccount ? (
                          <span className="font-medium text-blue-600">{formatCurrency(t.bankAccount.currentBalance || 0)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Record a deposit or withdrawal from the till</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={transactionFormData.transactionType}
                onValueChange={(value) => setTransactionFormData({ ...transactionFormData, transactionType: value as TillTransactionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bankAccountId">Bank Account (Optional)</Label>
              <Select
                value={transactionFormData.bankAccountId || undefined}
                onValueChange={(value) => setTransactionFormData({ ...transactionFormData, bankAccountId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} ({account.bankName}) - {formatCurrency(account.currentBalance || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={transactionFormData.amount}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={transactionFormData.description}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                placeholder="What is this transaction for?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={transactionFormData.reason}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, reason: e.target.value })}
                placeholder="Optional reason"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={transactionFormData.referenceNumber}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, referenceNumber: e.target.value })}
                placeholder="Optional reference"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={transactionFormData.notes}
                onChange={(e) => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTransaction} disabled={loading || !transactionFormData.description}>
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


