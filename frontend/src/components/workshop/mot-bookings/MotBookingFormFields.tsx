'use client';

import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { CustomerSearch } from '@/src/components/ui/customer-search';
import { VehicleSearch } from '@/src/components/ui/vehicle-search';
import {
  MOT_BOOKING_STATUSES,
  MOT_TEST_TYPES,
  MOT_TIME_SLOTS,
  TenantUserOption,
  WorkOrderOption,
} from '@/src/models/workshop/MotBooking';
import type { Customer } from '@/src/services/CustomerService';
import type { Vehicle } from '@/src/models/workshop';
import type { MotBookingFormData } from './types';
import { timeSlotKey } from './motBookingUtils';

type MotBookingFormFieldsProps = {
  formData: MotBookingFormData;
  users: TenantUserOption[];
  workOrders: WorkOrderOption[];
  selectedCustomer: Customer | null;
  selectedVehicle: Vehicle | null;
  onChange: (patch: Partial<MotBookingFormData>) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onTimeSlotChange: (slotKey: string) => void;
};

export function MotBookingFormFields({
  formData,
  users,
  workOrders,
  selectedCustomer,
  selectedVehicle,
  onChange,
  onCustomerSelect,
  onVehicleSelect,
  onTimeSlotChange,
}: MotBookingFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Customer</Label>
        <CustomerSearch
          value={selectedCustomer}
          onSelect={onCustomerSelect}
          placeholder="Search customer..."
          label=""
        />
      </div>

      {!selectedCustomer && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => onChange({ customerName: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => onChange({ customerPhone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => onChange({ customerEmail: e.target.value })}
              placeholder="Email address"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Vehicle</Label>
        <VehicleSearch
          value={selectedVehicle}
          onSelect={onVehicleSelect}
          placeholder="Search vehicle by registration or VIN..."
          label=""
        />
      </div>

      {!selectedVehicle && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vehicleRegistration">Registration</Label>
            <Input
              id="vehicleRegistration"
              value={formData.vehicleRegistration}
              onChange={(e) => onChange({ vehicleRegistration: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleMake">Make</Label>
            <Input
              id="vehicleMake"
              value={formData.vehicleMake}
              onChange={(e) => onChange({ vehicleMake: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleModel">Model</Label>
            <Input
              id="vehicleModel"
              value={formData.vehicleModel}
              onChange={(e) => onChange({ vehicleModel: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bookingDate">Booking date</Label>
          <Input
            id="bookingDate"
            type="date"
            value={formData.bookingDate}
            onChange={(e) => onChange({ bookingDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Time slot</Label>
          <Select value={timeSlotKey(formData)} onValueChange={onTimeSlotChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent>
              {MOT_TIME_SLOTS.map((slot) => (
                <SelectItem key={`${slot.start}-${slot.end}`} value={`${slot.start}-${slot.end}`}>
                  {slot.start} – {slot.end}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Test type</Label>
          <Select
            value={formData.testType}
            onValueChange={(value) => onChange({ testType: value as MotBookingFormData['testType'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOT_TEST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onChange({ status: value as MotBookingFormData['status'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOT_BOOKING_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={0.01}
            value={formData.price}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            value={formData.mileage}
            onChange={(e) => onChange({ mileage: e.target.value })}
            placeholder="Current mileage"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="motExpiryDate">Current MOT expiry</Label>
          <Input
            id="motExpiryDate"
            type="date"
            value={formData.motExpiryDate}
            onChange={(e) => onChange({ motExpiryDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned technician</Label>
          <Select
            value={formData.assignedTechnicianId || 'none'}
            onValueChange={(value) =>
              onChange({ assignedTechnicianId: value === 'none' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.username || user.email || user.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Linked work order</Label>
          <Select
            value={formData.workOrderId || 'none'}
            onValueChange={(value) =>
              onChange({ workOrderId: value === 'none' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional work order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {workOrders.map((wo) => (
                <SelectItem key={wo.id} value={wo.id}>
                  {wo.work_order_number} – {wo.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Booking notes, advisories, customer requests..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resultNotes">Result notes</Label>
        <Textarea
          id="resultNotes"
          value={formData.resultNotes}
          onChange={(e) => onChange({ resultNotes: e.target.value })}
          placeholder="Test result details, failure reasons..."
          rows={2}
        />
      </div>
    </div>
  );
}
