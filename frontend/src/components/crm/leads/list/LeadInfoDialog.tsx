'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { toast } from 'sonner';
import { Lead, PIPELINE_LABELS } from '@/src/models/crm';
import CRMService from '@/src/services/CRMService';
import { pipelineClass, type LeadUserOption } from '@/src/components/crm/leads/leadUtils';

const PIPELINE_OPTIONS = Object.entries(PIPELINE_LABELS).filter(([v]) => Boolean(v));

type LeadInfoDialogProps = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: LeadUserOption[];
  onSaved?: () => void;
};

type EditableLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pipelineStage: string;
  status: string;
  leadType: string;
  city: string;
  priceMin: string;
  priceMax: string;
  assignedTo: string;
  notes: string;
};

function toEditable(lead: Lead): EditableLead {
  return {
    firstName: lead.firstName || '',
    lastName: lead.lastName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    pipelineStage: lead.pipelineStage || 'new_lead',
    status: lead.status || 'open',
    leadType: lead.leadType || '',
    city: lead.city || '',
    priceMin: lead.priceMin != null ? String(lead.priceMin) : '',
    priceMax: lead.priceMax != null ? String(lead.priceMax) : '',
    assignedTo: lead.assignedTo || lead.mainAgentId || '',
    notes: lead.notes || '',
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-gray-500">{label}</Label>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  );
}

export function LeadInfoDialog({
  lead,
  open,
  onOpenChange,
  users,
  onSaved,
}: LeadInfoDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [form, setForm] = useState<EditableLead | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !lead) return;
    setMode('view');
    setForm(toEditable(lead));
  }, [open, lead]);

  if (!lead) return null;

  const assigneeName = users.find((u) => u.id === form?.assignedTo)?.name;

  const handleUpdate = async () => {
    if (!lead || !form) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSaving(true);
    try {
      await CRMService.updateLead(lead.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        pipelineStage: form.pipelineStage || undefined,
        status: form.status.trim() || undefined,
        leadType: form.leadType.trim() || undefined,
        city: form.city.trim() || undefined,
        priceMin: form.priceMin ? Number(form.priceMin) : undefined,
        priceMax: form.priceMax ? Number(form.priceMax) : undefined,
        assignedTo: form.assignedTo || undefined,
        mainAgentId: form.assignedTo || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Lead updated successfully!');
      onSaved?.();
      setMode('view');
    } catch {
      toast.error('Failed to update lead. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.firstName} {lead.lastName}
            {mode === 'edit' && (
              <Badge variant="secondary" className="ml-2">
                Editing
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name">{lead.firstName || '—'}</Field>
            <Field label="Last Name">{lead.lastName || '—'}</Field>
            <Field label="Email">{lead.email || '—'}</Field>
            <Field label="Phone">{lead.phone || '—'}</Field>
            <Field label="Pipeline Stage">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${pipelineClass(
                  lead.pipelineStage || 'new_lead',
                )}`}
              >
                {PIPELINE_LABELS[lead.pipelineStage || 'new_lead'] || lead.pipelineStage || 'New Lead'}
              </span>
            </Field>
            <Field label="Status">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize">
                {lead.status || 'open'}
              </span>
            </Field>
            <Field label="Lead Type">{lead.leadType || '—'}</Field>
            <Field label="Source">{lead.leadSource || lead.source || '—'}</Field>
            <Field label="City">{lead.city || '—'}</Field>
            <Field label="Assigned To">{assigneeName || lead.assignedTo || 'Unassigned'}</Field>
            <Field label="Min Price">
              {lead.priceMin != null ? `$${lead.priceMin.toLocaleString()}` : '—'}
            </Field>
            <Field label="Max Price">
              {lead.priceMax != null ? `$${lead.priceMax.toLocaleString()}` : '—'}
            </Field>
            <Field label="Buy Intent">{lead.buyIntent || '—'}</Field>
            <Field label="Sell Intent">{lead.sellIntent || '—'}</Field>
            <div className="md:col-span-2">
              <Field label="Notes">{lead.notes?.trim() || '—'}</Field>
            </div>
            <Field label="Created">
              {lead.createdAt ? CRMService.formatDateTime(lead.createdAt) : '—'}
            </Field>
            <Field label="Last Updated">
              {lead.updatedAt ? CRMService.formatDateTime(lead.updatedAt) : '—'}
            </Field>
          </div>
        ) : (
          form && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">First Name *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Name *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Pipeline Stage</Label>
                <Select
                  value={form.pipelineStage}
                  onValueChange={(v) => setForm({ ...form, pipelineStage: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_OPTIONS.map(([v, label]) => (
                      <SelectItem key={v} value={v}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Input
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Lead Type</Label>
                <Input
                  value={form.leadType}
                  onChange={(e) => setForm({ ...form, leadType: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Min Price</Label>
                <Input
                  type="number"
                  value={form.priceMin}
                  onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Max Price</Label>
                <Input
                  type="number"
                  value={form.priceMax}
                  onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                <Select
                  value={form.assignedTo || '__none__'}
                  onValueChange={(v) =>
                    setForm({ ...form, assignedTo: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Notes..."
                />
              </div>
            </div>
          )
        )}

        <DialogFooter>
          {mode === 'view' ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setForm(toEditable(lead));
                  setMode('edit');
                }}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('view')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={saving}>
                {saving ? 'Updating...' : 'Update'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
