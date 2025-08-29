"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  MoreVertical,
  Download,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { Invoice } from "../../models/sales";
import InvoiceService from "../../services/InvoiceService";
import { SessionManager } from "../../services/SessionManager";
import { toast } from "sonner";

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onSend: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InvoiceList({
  invoices,
  loading,
  onEdit,
  onDelete,
  onSend,
  onMarkAsPaid,
  currentPage,
  totalPages,
  onPageChange,
}: InvoiceListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (invoiceId: string) => {
    try {
      setDownloading(invoiceId);
      const sessionManager = new SessionManager();
      const token = sessionManager.getToken();

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/invoices/${invoiceId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Invoice downloaded successfully!");
      } else {
        toast.error("Failed to download invoice");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading invoice");
    } finally {
      setDownloading(null);
    }
  };
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
      {/* Invoices Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.orderNumber || "-"}</TableCell>
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
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {InvoiceService.formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {InvoiceService.formatCurrency(
                        invoice.total,
                        invoice.currency,
                      )}
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
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span
                      className={
                        invoice.balance > 0
                          ? "text-red-600 font-medium"
                          : "text-green-600 font-medium"
                      }
                    >
                      {InvoiceService.formatCurrency(
                        invoice.balance,
                        invoice.currency,
                      )}
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
                      {invoice.status === "draft" && (
                        <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invoice
                        </DropdownMenuItem>
                      )}
                      {invoice.status === "sent" && (
                        <DropdownMenuItem
                          onClick={() => onMarkAsPaid(invoice.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
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
                      {invoice.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => onDelete(invoice)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Invoice
                        </DropdownMenuItem>
                      )}
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
