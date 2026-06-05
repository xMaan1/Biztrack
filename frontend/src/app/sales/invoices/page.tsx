'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { InvoicesPlanRedirect } from '@/src/components/sales/InvoicesPlanRedirect';
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Filter, Settings } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout';
import { PermissionGuard } from '@/src/components/guards/PermissionGuard';
import InvoiceService from '../../../services/InvoiceService';
import {
  Invoice,
  InvoiceCreate,
  InvoiceFilters,
} from '../../../models/sales';
import { InvoiceDialog, InstallmentPlanCreateOption } from '../../../components/sales/InvoiceDialog';
import { CreateInvoiceSection } from '../../../components/sales/CreateInvoiceSection';
import { InvoiceList } from '../../../components/sales/InvoiceList';
import { InvoiceCustomizationDialog } from '../../../components/sales/InvoiceCustomizationDialog';
import { usePermissions } from '@/src/hooks/usePermissions';
import { usePlanInfo } from '@/src/hooks/usePlanInfo';
import { extractErrorMessage } from '@/src/utils/errorUtils';

function InvoicesPageContent() {
  const { canViewInvoices } = usePermissions();
  const { planInfo } = usePlanInfo();
  const isCommerce =
    planInfo?.planType === 'commerce' || planInfo?.planType === 'agency';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createError, setCreateError] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
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
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadingRef.current || !hasViewPermission) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

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
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [filters, searchTerm, statusFilter, currentPage, hasViewPermission]);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!hasViewPermission) return;
    loadData();
  }, [currentPage, filtersString, searchTerm, statusFilter, loadData, hasViewPermission]);

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
      setCreateError(null);
      loadData();
    } catch (err) {
      setCreateError(extractErrorMessage(err, 'Failed to create invoice'));
    }
  };

  const handleUpdateInvoice = async (
    invoiceId: string,
    invoiceData: Partial<InvoiceCreate>,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => {
    try {
      setUpdateError(null);
      await InvoiceService.updateInvoice(invoiceId, invoiceData);
      if (options?.installmentPlan) {
        const existingPlan =
          await InvoiceService.getInvoiceInstallmentPlan(invoiceId);
        if (!existingPlan) {
          await InvoiceService.createInstallmentPlan({
            ...options.installmentPlan,
            invoice_id: invoiceId,
          });
        }
      }
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
    setShowViewDialog(false);
    setUpdateError(null);
    setShowEditDialog(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
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

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 max-w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 md:px-5">
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
          </div>
        </div>

        <CreateInvoiceSection onSubmit={handleCreateInvoice} error={createError} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSearch}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        <InvoiceList
          invoices={invoices}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
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

        {/* Edit Invoice Dialog */}
        <InvoiceDialog
          open={showEditDialog && !!selectedInvoice}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setUpdateError(null);
            }
          }}
          onSubmit={(data, options) =>
            selectedInvoice &&
            handleUpdateInvoice(selectedInvoice.id, data, options)
          }
          mode="edit"
          invoice={selectedInvoice}
          error={updateError}
        />

        {/* View Invoice Dialog */}
        <InvoiceDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          onSubmit={() => {}}
          mode="view"
          invoice={selectedInvoice}
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

export default function InvoicesPage() {
  return (
    <InvoicesPlanRedirect>
      <PermissionGuard
        permission="sales:invoices:view"
        fallback={
          <DashboardLayout>
            <div className="px-3 py-12 text-center text-muted-foreground sm:px-4 md:px-5">
              You do not have permission to view invoices.
            </div>
          </DashboardLayout>
        }
        redirectTo={null}
      >
        <InvoicesPageContent />
      </PermissionGuard>
    </InvoicesPlanRedirect>
  );
}
