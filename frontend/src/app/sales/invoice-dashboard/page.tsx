'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/src/components/layout';
import { PermissionGuard } from '@/src/components/guards/PermissionGuard';
import { Button } from '@/src/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs';
import { InvoiceDashboard as InvoiceDashboardComponent } from '@/src/components/sales/InvoiceDashboard';
import { InvoiceOverduePanel } from '@/src/components/sales/InvoiceOverduePanel';
import { InvoiceDialog } from '@/src/components/sales/InvoiceDialog';
import InvoiceService from '@/src/services/InvoiceService';
import type { Invoice, InvoiceCreate, InvoiceDashboard } from '@/src/models/sales';
import { extractErrorMessage } from '@/src/utils/errorUtils';

function InvoiceDashboardPageContent() {
  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const dashboardData = await InvoiceService.getDashboard();
      setDashboard(dashboardData);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load invoice dashboard'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await InvoiceService.markInvoiceAsPaid(invoiceId);
      loadDashboard();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to mark invoice as paid'));
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setUpdateError(null);
    setShowEditDialog(true);
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
      loadDashboard();
    } catch (err) {
      setUpdateError(extractErrorMessage(err, 'Failed to update invoice'));
    }
  };

  if (loading && !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex h-64 w-full items-center justify-center px-3 py-4">
          <div className="text-lg">Loading Invoice Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !dashboard) {
    return (
      <DashboardLayout>
        <div className="w-full px-3 py-4 text-center sm:px-4 md:px-5">
          <div className="mb-4 text-red-600">Error: {error}</div>
          <Button onClick={loadDashboard}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 max-w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 md:px-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Dashboard</h1>
          <p className="text-gray-600">
            Monitor invoice metrics, revenue trends, and overdue payments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {dashboard && <InvoiceDashboardComponent dashboard={dashboard} />}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-6">
            <InvoiceOverduePanel
              dashboard={dashboard}
              onMarkAsPaid={handleMarkAsPaid}
              onEdit={handleEdit}
            />
          </TabsContent>
        </Tabs>

        <InvoiceDialog
          open={showEditDialog && !!selectedInvoice}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setUpdateError(null);
          }}
          onSubmit={(data) =>
            selectedInvoice && handleUpdateInvoice(selectedInvoice.id, data)
          }
          mode="edit"
          invoice={selectedInvoice}
          error={updateError}
        />
      </div>
    </DashboardLayout>
  );
}

export default function InvoiceDashboardPage() {
  return (
    <PermissionGuard
      permission="sales:invoice_dashboard:view"
      fallback={
        <DashboardLayout>
          <div className="px-3 py-12 text-center text-muted-foreground sm:px-4 md:px-5">
            You do not have permission to view the invoice dashboard.
          </div>
        </DashboardLayout>
      }
      redirectTo={null}
    >
      <InvoiceDashboardPageContent />
    </PermissionGuard>
  );
}
