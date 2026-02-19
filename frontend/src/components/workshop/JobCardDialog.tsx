'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { CustomerSearch } from '../ui/customer-search';
import { apiService } from '../../services/ApiService';
import { Customer } from '../../services/CustomerService';
import { JobCard, JobCardCreate, JobCardUpdate } from '../../models/workshop';

interface JobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  jobCard?: JobCard | null;
  onSuccess: () => void;
}

export default function JobCardDialog({
  open,
  onOpenChange,
  mode,
  jobCard,
  onSuccess,
}: JobCardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [workOrders, setWorkOrders] = useState<{ id: string; work_order_number: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name?: string; username?: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    work_order_id: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_vin: '',
    assigned_to_id: '',
    planned_date: '',
    labor_estimate: 0,
    parts_estimate: 0,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      apiService.get('/work-orders?limit=500').then((data: any) => {
        setWorkOrders(Array.isArray(data) ? data : []);
      }).catch(() => setWorkOrders([]));
      apiService.get('/tenants/current/users').then((res: any) => {
        const list = res?.data ?? res ?? [];
        setUsers(Array.isArray(list) ? list : []);
      }).catch(() => setUsers([]));
      if (mode === 'edit' && jobCard?.customer_id) {
        apiService.get(`/invoices/customers/${jobCard.customer_id}`).then((c: Customer) => setSelectedCustomer(c)).catch(() => setSelectedCustomer(null));
      } else {
        setSelectedCustomer(null);
      }
    }
  }, [open, mode, jobCard?.customer_id]);

  useEffect(() => {
    if (jobCard && (mode === 'edit')) {
      const vi = (jobCard.vehicle_info || {}) as Record<string, string>;
      setFormData({
        title: jobCard.title || '',
        description: jobCard.description || '',
        status: jobCard.status || 'draft',
        priority: jobCard.priority || 'medium',
        work_order_id: jobCard.work_order_id || '',
        vehicle_make: vi.make || '',
        vehicle_model: vi.model || '',
        vehicle_year: vi.year || '',
        vehicle_vin: vi.vin || '',
        assigned_to_id: jobCard.assigned_to_id || '',
        planned_date: jobCard.planned_date ? jobCard.planned_date.split('T')[0] : '',
        labor_estimate: jobCard.labor_estimate ?? 0,
        parts_estimate: jobCard.parts_estimate ?? 0,
        notes: jobCard.notes || '',
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        status: 'draft',
        priority: 'medium',
        work_order_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        vehicle_vin: '',
        assigned_to_id: '',
        planned_date: '',
        labor_estimate: 0,
        parts_estimate: 0,
        notes: '',
      });
    }
    setErrorMessage('');
  }, [jobCard, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.title.trim()) {
      setErrorMessage('Title is required');
      return;
    }
    setLoading(true);
    try {
      const payload: JobCardCreate | JobCardUpdate = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        work_order_id: formData.work_order_id || undefined,
        customer_id: selectedCustomer?.id || undefined,
        vehicle_info: {
          make: formData.vehicle_make || undefined,
          model: formData.vehicle_model || undefined,
          year: formData.vehicle_year || undefined,
          vin: formData.vehicle_vin || undefined,
        },
        assigned_to_id: formData.assigned_to_id || undefined,
        planned_date: formData.planned_date ? formData.planned_date + 'T12:00:00Z' : undefined,
        labor_estimate: formData.labor_estimate,
        parts_estimate: formData.parts_estimate,
        notes: formData.notes || undefined,
      };
      if (mode === 'create') {
        await apiService.post('/job-cards', payload);
      } else if (jobCard) {
        await apiService.put(`/job-cards/${jobCard.id}`, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      setErrorMessage('Failed to save job card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Job Card' : 'Edit Job Card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Job title"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Work Order</Label>
              <Select value={formData.work_order_id || 'none'} onValueChange={(v) => setFormData({ ...formData, work_order_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>{wo.work_order_number} – {wo.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <CustomerSearch
                label="Customer"
                value={selectedCustomer}
                onSelect={setSelectedCustomer}
                placeholder="Search by name, email, phone..."
              />
            </div>
            <div>
              <Label>Vehicle make</Label>
              <Input value={formData.vehicle_make} onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })} />
            </div>
            <div>
              <Label>Vehicle model</Label>
              <Input value={formData.vehicle_model} onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })} />
            </div>
            <div>
              <Label>Vehicle year</Label>
              <Input value={formData.vehicle_year} onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })} />
            </div>
            <div>
              <Label>VIN</Label>
              <Input value={formData.vehicle_vin} onChange={(e) => setFormData({ ...formData, vehicle_vin: e.target.value })} />
            </div>
            <div>
              <Label>Assigned to</Label>
              <Select value={formData.assigned_to_id || 'none'} onValueChange={(v) => setFormData({ ...formData, assigned_to_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.username || u.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Planned date</Label>
              <Input type="date" value={formData.planned_date} onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })} />
            </div>
            <div>
              <Label>Labor estimate</Label>
              <Input type="number" step="0.01" min={0} value={formData.labor_estimate} onChange={(e) => setFormData({ ...formData, labor_estimate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Parts estimate</Label>
              <Input type="number" step="0.01" min={0} value={formData.parts_estimate} onChange={(e) => setFormData({ ...formData, parts_estimate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
