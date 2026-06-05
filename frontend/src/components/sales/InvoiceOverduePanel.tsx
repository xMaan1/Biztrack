'use client';

import { AlertTriangle, CheckCircle, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import type { Invoice, InvoiceDashboard } from '../../models/sales';
import InvoiceService from '../../services/InvoiceService';
import { useCurrency } from '@/src/contexts/CurrencyContext';

type InvoiceOverduePanelProps = {
  dashboard: InvoiceDashboard | null;
  onMarkAsPaid: (invoiceId: string) => void;
  onEdit: (invoice: Invoice) => void;
};

export function InvoiceOverduePanel({
  dashboard,
  onMarkAsPaid,
  onEdit,
}: InvoiceOverduePanelProps) {
  const { formatCurrency } = useCurrency();
  const overdueInvoices = dashboard?.overdueInvoices ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Overdue Invoices
        </CardTitle>
        <CardDescription>
          Invoices that are past their due date and require immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {overdueInvoices.length > 0 ? (
          <div className="space-y-4">
            {overdueInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    {invoice.invoiceNumber} - {invoice.customerName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Due: {InvoiceService.formatDate(invoice.dueDate)} • Amount:{' '}
                    {formatCurrency(invoice.total)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => onMarkAsPaid(invoice.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Mark Paid
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p>No overdue invoices! All invoices are up to date.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
