'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  MoreVertical,
  Download,
  Calendar,
  FileText,
  Send,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { Invoice } from '../../models/sales';
import InvoiceService from '../../services/InvoiceService';
import { toast } from 'sonner';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onSend?: (invoiceId: string) => Promise<void>;
  onMarkAsPaid: (invoiceId: string) => void;
  onBulkSend?: (invoiceIds: string[]) => void;
  onBulkMarkAsPaid?: (invoiceIds: string[]) => void;
  onBulkMarkAsUnpaid?: (invoiceIds: string[]) => void;
  onBulkDelete?: (invoiceIds: string[]) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InvoiceList({
  invoices,
  loading,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onBulkSend,
  onBulkMarkAsPaid,
  onBulkMarkAsUnpaid,
  onBulkDelete,
  currentPage,
  totalPages,
  onPageChange,
}: InvoiceListProps) {
  const { formatCurrency } = useCurrency();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);

  const handleSendWhatsApp = (invoice: Invoice) => {
    const invoiceMessage = `📄 *Invoice Details*

*Invoice Number:* ${invoice.invoiceNumber}
*Customer:* ${invoice.customerName}
*Amount:* ${formatCurrency(invoice.total)}
*Due Date:* ${InvoiceService.formatDate(invoice.dueDate)}
*Status:* ${InvoiceService.getStatusLabel(invoice.status)}

Please find the attached invoice for your review and payment.`;

    const encodedMessage = encodeURIComponent(invoiceMessage);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleBulkSendWhatsApp = () => {
    if (selectedInvoices.size === 0) return;
    
    const selectedInvoiceData = invoices.filter(inv => selectedInvoices.has(inv.id));
    
    if (selectedInvoiceData.length === 0) return;
    
    const invoiceNumbers = selectedInvoiceData.map(inv => inv.invoiceNumber).join(', ');
    const totalAmount = selectedInvoiceData.reduce((sum, inv) => sum + inv.total, 0);
    
    const message = `📄 *Multiple Invoice Details*

*Invoice Numbers:* ${invoiceNumbers}
*Total Amount:* ${formatCurrency(totalAmount)}
*Count:* ${selectedInvoiceData.length} invoice${selectedInvoiceData.length !== 1 ? 's' : ''}

Please find the attached invoices for your review and payment.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      setDownloading(invoiceId);

      const blob = await InvoiceService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded successfully!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        let errorMessage = 'Error downloading invoice';

        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response?.data === 'string') {
          errorMessage = error.response.data;
        }

        if (errorMessage.includes('customization is required')) {
          toast.error('Please customize your invoice template first using the \'Customize Invoice\' button.', {
            duration: 5000,
          });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Error downloading invoice');
      }
    } finally {
      setDownloading(null);
    }
  };

  // Bulk operation handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(invoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleBulkSend = async () => {
    if (!onBulkSend || selectedInvoices.size === 0) return;
    
    setBulkLoading('send');
    try {
      await onBulkSend(Array.from(selectedInvoices));
      setSelectedInvoices(new Set());
      toast.success(`${selectedInvoices.size} invoices sent successfully!`);
    } catch (error) {
      toast.error('Failed to send invoices');
    } finally {
      setBulkLoading(null);
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (!onBulkMarkAsPaid || selectedInvoices.size === 0) return;
    
    setBulkLoading('paid');
    try {
      await onBulkMarkAsPaid(Array.from(selectedInvoices));
      setSelectedInvoices(new Set());
      toast.success(`${selectedInvoices.size} invoices marked as paid!`);
    } catch (error) {
      toast.error('Failed to mark invoices as paid');
    } finally {
      setBulkLoading(null);
    }
  };

  const handleBulkMarkAsUnpaid = async () => {
    if (!onBulkMarkAsUnpaid || selectedInvoices.size === 0) return;
    
    setBulkLoading('unpaid');
    try {
      await onBulkMarkAsUnpaid(Array.from(selectedInvoices));
      setSelectedInvoices(new Set());
      toast.success(`${selectedInvoices.size} invoices marked as unpaid!`);
    } catch (error) {
      toast.error('Failed to mark invoices as unpaid');
    } finally {
      setBulkLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedInvoices.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedInvoices.size} invoices? This action cannot be undone.`)) {
      return;
    }
    
    setBulkLoading('delete');
    try {
      await onBulkDelete(Array.from(selectedInvoices));
      setSelectedInvoices(new Set());
      toast.success(`${selectedInvoices.size} invoices deleted successfully!`);
    } catch (error) {
      toast.error('Failed to delete invoices');
    } finally {
      setBulkLoading(null);
    }
  };

  const isAllSelected = invoices.length > 0 && selectedInvoices.size === invoices.length;
  const isIndeterminate = selectedInvoices.size > 0 && selectedInvoices.size < invoices.length;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading invoices...</div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No invoices found. Create your first invoice to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedInvoices.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSend}
                  disabled={bulkLoading === 'send'}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  {bulkLoading === 'send' ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkSendWhatsApp}
                  className="text-green-600 border-green-300 hover:bg-green-100"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send via WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkMarkAsPaid}
                  disabled={bulkLoading === 'paid'}
                  className="text-green-600 border-green-300 hover:bg-green-100"
                >
                  {bulkLoading === 'paid' ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-300 border-t-green-600" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkMarkAsUnpaid}
                  disabled={bulkLoading === 'unpaid'}
                  className="text-orange-600 border-orange-300 hover:bg-orange-100"
                >
                  {bulkLoading === 'unpaid' ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark as Unpaid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading === 'delete'}
                  className="text-red-600 border-red-300 hover:bg-red-100"
                >
                  {bulkLoading === 'delete' ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete All
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedInvoices(new Set())}
              className="text-blue-600 hover:bg-blue-100"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el && 'indeterminate' in el) {
                      (el as HTMLInputElement).indeterminate = isIndeterminate;
                    }
                  }}
                />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className={selectedInvoices.has(invoice.id) ? 'bg-blue-50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={selectedInvoices.has(invoice.id)}
                    onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.orderNumber || '-'}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.customerName}</div>
                    <div className="text-sm text-gray-500">
                      {invoice.customerEmail}
                    </div>
                    {invoice.customerPhone && (
                      <div className="text-sm text-gray-500">
                        {invoice.customerPhone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {InvoiceService.formatDate(invoice.issueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span
                      className={
                        InvoiceService.isOverdue(invoice.dueDate)
                          ? 'text-red-600 font-medium'
                          : ''
                      }
                    >
                      {InvoiceService.formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(invoice.total)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={InvoiceService.getStatusColor(invoice.status)}
                  >
                    {InvoiceService.getStatusLabel(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        invoice.balance > 0
                          ? 'text-red-600 font-medium'
                          : 'text-green-600 font-medium'
                      }
                    >
                      {formatCurrency(invoice.balance)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(invoice)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(invoice)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Invoice
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handleSendWhatsApp(invoice)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send via WhatsApp
                        </DropdownMenuItem>
                      )}
                      {invoice.status === 'sent' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onMarkAsPaid(invoice.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendWhatsApp(invoice)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Send Reminder via WhatsApp
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDownload(invoice.id)}
                        disabled={downloading === invoice.id}
                      >
                        {downloading === invoice.id ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(invoice)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
