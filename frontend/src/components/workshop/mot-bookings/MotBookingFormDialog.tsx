'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import type { MotBooking, TenantUserOption, WorkOrderOption } from '@/src/models/workshop/MotBooking';
import type { Customer } from '@/src/services/CustomerService';
import type { Vehicle } from '@/src/models/workshop';
import type { MotBookingFormData } from './types';
import { MotBookingFormFields } from './MotBookingFormFields';

type MotBookingFormDialogProps = {
  open: boolean;
  editingBooking: MotBooking | null;
  formData: MotBookingFormData;
  users: TenantUserOption[];
  workOrders: WorkOrderOption[];
  selectedCustomer: Customer | null;
  selectedVehicle: Vehicle | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (patch: Partial<MotBookingFormData>) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onTimeSlotChange: (slotKey: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function MotBookingFormDialog({
  open,
  editingBooking,
  formData,
  users,
  workOrders,
  selectedCustomer,
  selectedVehicle,
  saving,
  onOpenChange,
  onFormChange,
  onCustomerSelect,
  onVehicleSelect,
  onTimeSlotChange,
  onSubmit,
}: MotBookingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBooking ? 'Edit MOT Booking' : 'New MOT Booking'}</DialogTitle>
          <DialogDescription>
            {editingBooking
              ? 'Update the MOT checkup booking details.'
              : 'Schedule a new MOT test appointment for a customer and vehicle.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <MotBookingFormFields
            formData={formData}
            users={users}
            workOrders={workOrders}
            selectedCustomer={selectedCustomer}
            selectedVehicle={selectedVehicle}
            onChange={onFormChange}
            onCustomerSelect={onCustomerSelect}
            onVehicleSelect={onVehicleSelect}
            onTimeSlotChange={onTimeSlotChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {editingBooking ? 'Update Booking' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
