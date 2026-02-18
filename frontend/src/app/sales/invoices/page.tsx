'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import {
  Plus,
  Filter,
  Settings,
  AlertTriangle,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout';
import InvoiceService from '../../../services/InvoiceService';
import {
  Invoice,
  InvoiceCreate,
  InvoiceFilters,
  InvoiceDashboard,
} from '../../../models/sales';
import { InvoiceDialog, InstallmentPlanCreateOption } from '../../../components/sales/InvoiceDialog';
import { InvoiceList } from '../../../components/sales/InvoiceList';
import { InvoiceDashboard as InvoiceDashboardComponent } from '../../../components/sales/InvoiceDashboard';
import { InvoiceCustomizationDialog } from '../../../components/sales/InvoiceCustomizationDialog';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { usePlanInfo } from '@/src/hooks/usePlanInfo';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function InvoicesPage() {
  const { formatCurrency } = useCurrency();
  const { isOwner, canViewInvoices } = usePermissions();
  const { planInfo } = usePlanInfo();
  const isCommerce = planInfo?.planType === 'commerce';
  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const hasViewPermission = useMemo(() => canViewInvoices(), [canViewInvoices]);
  const userIsOwner = useMemo(() => isOwner(), [isOwner]);
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      if (activeTab === 'dashboard' && userIsOwner) {
        const dashboardData = await InvoiceService.getDashboard();
        setDashboard(dashboardData);
      } else {
        const response = await InvoiceService.getInvoices(
          {
            ...filters,
            search: searchTerm,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          },
          currentPage,
          10,
        );
        setInvoices(response.invoices || []);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [activeTab, filters, searchTerm, statusFilter, currentPage, userIsOwner]);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!hasViewPermission) {
      setActiveTab('invoices');
      return;
    }
    if (!userIsOwner && activeTab === 'dashboard') {
      setActiveTab('invoices');
      return;
    }
    loadData();
  }, [activeTab, currentPage, filtersString, searchTerm, statusFilter, loadData, hasViewPermission, userIsOwner]);

  const handleCreateInvoice = async (
    invoiceData: InvoiceCreate,
    options?: { installmentPlan?: InstallmentPlanCreateOption }
  ) => {
    try {
      const created = await InvoiceService.createInvoice(invoiceData);
      if (options?.installmentPlan) {
        await InvoiceService.createInstallmentPlan({
          ...options.installmentPlan,
          invoice_id: created.id,
        });
      }
      setShowCreateDialog(false);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create invoice'));
    }
  };

  const handleUpdateInvoice = async (
    invoiceId: string,
    invoiceData: Partial<InvoiceCreate>,
  ) => {
    try {
      setUpdateError(null);
      await InvoiceService.updateInvoice(invoiceId, invoiceData);
      setShowEditDialog(false);
      setSelectedInvoice(null);
      setUpdateError(null);
      loadData();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to update invoice');
      setUpdateError(errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      setDeleteError(null);
      await InvoiceService.deleteInvoice(invoiceId);
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
      setDeleteError(null);
      loadData();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to delete invoice');
      setDeleteError(errorMessage);
      setError(errorMessage);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await InvoiceService.sendInvoice(invoiceId);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send invoice'));
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await InvoiceService.markInvoiceAsPaid(invoiceId);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to mark invoice as paid'));
    }
  };

  // Bulk operations
  const handleBulkSend = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkSendInvoices(invoiceIds);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send invoices'));
    }
  };

  const handleBulkMarkAsPaid = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkMarkAsPaid(invoiceIds);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to mark invoices as paid'));
    }
  };

  const handleBulkMarkAsUnpaid = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkMarkAsUnpaid(invoiceIds);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to mark invoices as unpaid'));
    }
  };

  const handleBulkDelete = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkDeleteInvoices(invoiceIds);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete invoices'));
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setUpdateError(null);
    setShowEditDialog(true);
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const handleFilterChange = (newFilters: Partial<InvoiceFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading Invoice Dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && activeTab === 'dashboard') {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={loadData}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCommerce ? 'Sales Invoices' : 'Invoices'}
            </h1>
            <p className="text-gray-600">
              {isCommerce
                ? 'Create and manage sales invoices, track payments, and monitor revenue'
                : 'Manage your invoices, track payments, and monitor revenue'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowCustomizeDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Customize Invoice
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="modern-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Customization Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Customize Your Invoice Template
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Before downloading invoices, please customize your invoice template with your company details,
                  payment information, and styling preferences using the "Customize Invoice" button above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isOwner() ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {isOwner() && (
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            )}
            <TabsTrigger value="invoices">All Invoices</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Only visible to owners */}
          {isOwner() && (
            <TabsContent value="dashboard" className="space-y-6">
              {dashboard && <InvoiceDashboardComponent dashboard={dashboard} />}
            </TabsContent>
          )}

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) =>
                        handleFilterChange({ dateFrom: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) =>
                        handleFilterChange({ dateTo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSearch}>Apply Filters</Button>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <InvoiceList
              invoices={invoices}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSend={handleSendInvoice}
              onMarkAsPaid={handleMarkAsPaid}
              onBulkSend={handleBulkSend}
              onBulkMarkAsPaid={handleBulkMarkAsPaid}
              onBulkMarkAsUnpaid={handleBulkMarkAsUnpaid}
              onBulkDelete={handleBulkDelete}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Invoices
                </CardTitle>
                <CardDescription>
                  Invoices that are past their due date and require immediate
                  attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.overdueInvoices &&
                dashboard.overdueInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.overdueInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {invoice.invoiceNumber} - {invoice.customerName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Due: {InvoiceService.formatDate(invoice.dueDate)} •
                            Amount:{' '}
                            {formatCurrency(invoice.total)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No overdue invoices! All invoices are up to date.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Invoice Dialog */}
        <InvoiceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateInvoice}
          mode="create"
        />

        {/* Edit Invoice Dialog */}
        <InvoiceDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setUpdateError(null);
            }
          }}
          onSubmit={(data) =>
            selectedInvoice && handleUpdateInvoice(selectedInvoice.id, data)
          }
          mode="edit"
          invoice={selectedInvoice}
          error={updateError}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteError(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Are you sure you want to delete invoice{' '}
                <strong>{selectedInvoice?.invoiceNumber}</strong>? This action
                cannot be undone.
              </p>
              {deleteError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedInvoice && handleDeleteInvoice(selectedInvoice.id)
                }
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice Customization Dialog */}
        <InvoiceCustomizationDialog
          open={showCustomizeDialog}
          onOpenChange={setShowCustomizeDialog}
        />
      </div>
    </DashboardLayout>
  );
}
