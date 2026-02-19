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
import { Alert, AlertDescription } from '../ui/alert';
import { CustomerSearch } from '../ui/customer-search';
import { Customer } from '../../services/CustomerService';
import { apiService } from '../../services/ApiService';
import { Vehicle, VehicleCreate, VehicleUpdate } from '../../models/workshop';

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  vehicle?: Vehicle | null;
  onSuccess: () => void;
}

export default function VehicleDialog({
  open,
  onOpenChange,
  mode,
  vehicle,
  onSuccess,
}: VehicleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    registration_number: '',
    mileage: '',
    notes: '',
  });

  useEffect(() => {
    if (open && mode === 'edit' && vehicle?.customer_id) {
      apiService.get(`/invoices/customers/${vehicle.customer_id}`).then((c: Customer) => setSelectedCustomer(c)).catch(() => setSelectedCustomer(null));
    } else if (open && mode === 'create') {
      setSelectedCustomer(null);
    }
  }, [open, mode, vehicle?.customer_id]);

  useEffect(() => {
    if (vehicle && mode === 'edit') {
      setFormData({
        make: vehicle.make ?? '',
        model: vehicle.model ?? '',
        year: vehicle.year ?? '',
        color: vehicle.color ?? '',
        vin: vehicle.vin ?? '',
        registration_number: vehicle.registration_number ?? '',
        mileage: vehicle.mileage ?? '',
        notes: vehicle.notes ?? '',
      });
    } else if (mode === 'create') {
      setFormData({
        make: '',
        model: '',
        year: '',
        color: '',
        vin: '',
        registration_number: '',
        mileage: '',
        notes: '',
      });
    }
    setErrorMessage('');
  }, [vehicle, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const payload: VehicleCreate | VehicleUpdate = {
        make: formData.make || undefined,
        model: formData.model || undefined,
        year: formData.year || undefined,
        color: formData.color || undefined,
        vin: formData.vin || undefined,
        registration_number: formData.registration_number || undefined,
        mileage: formData.mileage || undefined,
        customer_id: selectedCustomer?.id || undefined,
        notes: formData.notes || undefined,
      };
      if (mode === 'create') {
        await apiService.post('/vehicles', payload);
      } else if (vehicle) {
        await apiService.put(`/vehicles/${vehicle.id}`, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      setErrorMessage('Failed to save vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Vehicle' : 'Edit Vehicle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Registration number</Label>
              <Input
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="e.g. ABC 1234"
              />
            </div>
            <div>
              <Label>VIN</Label>
              <Input
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="Vehicle Identification Number"
              />
            </div>
            <div>
              <Label>Make</Label>
              <Input value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} placeholder="e.g. Toyota" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. Corolla" />
            </div>
            <div>
              <Label>Year</Label>
              <Input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="e.g. 2020" />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="e.g. Silver" />
            </div>
            <div>
              <Label>Mileage</Label>
              <Input value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} placeholder="e.g. 50000 km" />
            </div>
            <div className="md:col-span-2">
              <CustomerSearch
                label="Customer (optional)"
                value={selectedCustomer}
                onSelect={setSelectedCustomer}
                placeholder="Search customer..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
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
