'use client';

import React, { useEffect, useState } from 'react';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Banknote,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { bankingService } from '../../../services/BankingService';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatDate } from '../../../lib/utils';
import {
  BankAccount,
  BankAccountType,
  getAccountTypeLabel,
} from '../../../models/banking';
import { DashboardLayout } from '../../../components/layout';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { toast } from 'sonner';

export default function BankAccountsPage() {
  return (
    <ModuleGuard module="banking" fallback={<div>You don't have access to Banking module</div>}>
      <BankAccountsContent />
    </ModuleGuard>
  );
}

function BankAccountsContent() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<BankAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState({
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
    tags: [] as string[],
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await bankingService.getBankAccounts(true);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setIsSubmitting(true);
      await bankingService.createBankAccount(formData);
      toast.success('Bank account created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadBankAccounts();
    } catch (error) {
      console.error('Failed to create bank account:', error);
      toast.error('Failed to create bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount) return;

    try {
      setIsSubmitting(true);
      await bankingService.updateBankAccount(selectedAccount.id, formData);
      toast.success('Bank account updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      loadBankAccounts();
    } catch (error) {
      console.error('Failed to update bank account:', error);
      toast.error('Failed to update bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      setDeleteLoading(true);
      await bankingService.deleteBankAccount(selectedAccount.id);
      toast.success('Bank account deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedAccount(null);
      loadBankAccounts();
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      toast.error('Failed to delete bank account');
    } finally {
      setDeleteLoading(false);
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

  const openEditModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber || '',
      bankName: account.bankName,
      bankCode: account.bankCode || '',
      accountType: account.accountType,
      currency: account.currency,
      currentBalance: account.currentBalance,
      availableBalance: account.availableBalance,
      pendingBalance: account.pendingBalance,
      isActive: account.isActive,
      isPrimary: account.isPrimary,
      supportsOnlineBanking: account.supportsOnlineBanking,
      description: account.description || '',
      tags: account.tags,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const filteredAccounts = bankAccounts.filter(account =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm)
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading bank accounts...</span>
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
            <h1 className="text-3xl font-bold">Bank Accounts</h1>
            <p className="text-muted-foreground">
              Manage your bank accounts and track balances
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts ({filteredAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{account.accountName}</div>
                          {account.description && (
                            <div className="text-sm text-muted-foreground">
                              {account.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        ****{account.accountNumber.slice(-4)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getAccountTypeLabel(account.accountType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(account.availableBalance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {account.isPrimary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingAccount(account)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(account)}
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

        {/* Create Bank Account Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bank Account</DialogTitle>
              <DialogDescription>
                Add a new bank account to track transactions and balances.
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
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g., Chase Bank"
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
                      {Object.values(BankAccountType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getAccountTypeLabel(type)}
                        </SelectItem>
                      ))}
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this account"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrimary: checked }))}
                  />
                  <Label htmlFor="isPrimary">Primary Account</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="supportsOnlineBanking"
                    checked={formData.supportsOnlineBanking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, supportsOnlineBanking: checked }))}
                  />
                  <Label htmlFor="supportsOnlineBanking">Supports Online Banking</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bank Account Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Bank Account</DialogTitle>
              <DialogDescription>
                Update bank account information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-accountName">Account Name *</Label>
                  <Input
                    id="edit-accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g., Main Business Account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountNumber">Account Number *</Label>
                  <Input
                    id="edit-accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-routingNumber">Routing Number</Label>
                  <Input
                    id="edit-routingNumber"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bankName">Bank Name *</Label>
                  <Input
                    id="edit-bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g., Chase Bank"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-accountType">Account Type *</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value as BankAccountType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BankAccountType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getAccountTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
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
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this account"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-isActive">Active Account</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isPrimary"
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrimary: checked }))}
                  />
                  <Label htmlFor="edit-isPrimary">Primary Account</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-supportsOnlineBanking"
                    checked={formData.supportsOnlineBanking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, supportsOnlineBanking: checked }))}
                  />
                  <Label htmlFor="edit-supportsOnlineBanking">Supports Online Banking</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAccount} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bank Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the bank account "{selectedAccount?.accountName}"? 
                This action will deactivate the account and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
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
                openEditModal(viewingAccount!);
              }}>
                Edit Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
