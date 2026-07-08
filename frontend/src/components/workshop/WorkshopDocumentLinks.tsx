'use client';

import React, { useEffect, useState } from 'react';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { apiService } from '../../services/ApiService';
import { inventoryService } from '../../services/InventoryService';
import InvoiceService from '../../services/InvoiceService';

export type WorkshopDocumentLinksValue = {
  purchaseOrderId?: string;
  jobCardId?: string;
  invoiceId?: string;
};

type WorkshopDocumentLinksProps = {
  value: WorkshopDocumentLinksValue;
  excludeType: 'purchase_order' | 'job_card' | 'invoice';
  onChange: (value: WorkshopDocumentLinksValue) => void;
};

export function WorkshopDocumentLinks({
  value,
  excludeType,
  onChange,
}: WorkshopDocumentLinksProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; orderNumber: string }[]>([]);
  const [jobCards, setJobCards] = useState<{ id: string; job_card_number: string; title: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoiceNumber: string; customerName: string }[]>([]);

  useEffect(() => {
    inventoryService.getPurchaseOrders(undefined, 0, 500).then((res) => {
      setPurchaseOrders(
        (res.purchaseOrders || []).map((po) => ({
          id: po.id,
          orderNumber: po.orderNumber,
        })),
      );
    }).catch(() => setPurchaseOrders([]));

    apiService.get('/job-cards?limit=500').then((data: any) => {
      const list = Array.isArray(data) ? data : [];
      setJobCards(
        list.map((jc: any) => ({
          id: jc.id,
          job_card_number: jc.job_card_number,
          title: jc.title,
        })),
      );
    }).catch(() => setJobCards([]));

    InvoiceService.getInvoices({}, 1, 500).then((res) => {
      setInvoices(
        (res.invoices || []).map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
        })),
      );
    }).catch(() => setInvoices([]));
  }, []);

  const update = (patch: Partial<WorkshopDocumentLinksValue>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Linked documents</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {excludeType !== 'purchase_order' && (
          <div className="space-y-2">
            <Label>Purchase order</Label>
            <Select
              value={value.purchaseOrderId || 'none'}
              onValueChange={(v) => update({ purchaseOrderId: v === 'none' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purchase order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {excludeType !== 'job_card' && (
          <div className="space-y-2">
            <Label>Job card</Label>
            <Select
              value={value.jobCardId || 'none'}
              onValueChange={(v) => update({ jobCardId: v === 'none' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {jobCards.map((jc) => (
                  <SelectItem key={jc.id} value={jc.id}>
                    {jc.job_card_number} – {jc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {excludeType !== 'invoice' && (
          <div className="space-y-2">
            <Label>Invoice</Label>
            <Select
              value={value.invoiceId || 'none'}
              onValueChange={(v) => update({ invoiceId: v === 'none' ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} – {inv.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
