'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  ClipboardList,
  Building2,
  Calendar,
  Package,
  FileText,
} from 'lucide-react';
import { PurchaseOrder } from '../../models/inventory';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatDate } from '../../lib/utils';

interface PurchaseOrderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

export default function PurchaseOrderViewModal({
  isOpen,
  onClose,
  purchaseOrder,
}: PurchaseOrderViewModalProps) {
  const { formatCurrency } = useCurrency();

  if (!purchaseOrder) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'default', label: 'Submitted' },
      approved: { variant: 'default', label: 'Approved' },
      ordered: { variant: 'default', label: 'Ordered' },
      received: { variant: 'default', label: 'Received' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Purchase Order Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Order Number</Label>
                <p className="text-lg font-semibold">{purchaseOrder.orderNumber}</p>
              </div>
              {purchaseOrder.batchNumber && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Batch Number</Label>
                  <p className="text-lg font-mono">{purchaseOrder.batchNumber}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Supplier</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{purchaseOrder.supplierName}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Order Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg">{formatDate(purchaseOrder.orderDate)}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Expected Delivery</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg">{formatDate(purchaseOrder.expectedDeliveryDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-600">Subtotal</Label>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(purchaseOrder.subtotal || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-600">
                  VAT ({(purchaseOrder.vatRate || 0)}%)
                </Label>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(purchaseOrder.vatAmount || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium text-blue-600">Total Amount</Label>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(purchaseOrder.totalAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {purchaseOrder.items && purchaseOrder.items.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({purchaseOrder.items.length})
              </h3>
              <div className="space-y-3">
                {purchaseOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-lg">{item.productName}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {item.sku} | Quantity: {item.quantity}
                      </div>
                      {item.notes && (
                        <div className="text-sm text-gray-500 mt-1">{item.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {item.quantity} × {formatCurrency(item.unitCost)}
                      </div>
                      <div className="font-semibold text-lg">
                        {formatCurrency(item.totalCost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{purchaseOrder.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Order ID</Label>
                <p className="text-sm font-mono text-gray-500">{purchaseOrder.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p className="text-sm text-gray-500">{formatDate(purchaseOrder.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                <p className="text-sm text-gray-500">{formatDate(purchaseOrder.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
