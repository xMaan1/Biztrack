import type {
  MotBooking,
  MotBookingCreate,
  MotTestType,
  MotBookingStatus,
} from '@/src/models/workshop/MotBooking';
import { MOT_TIME_SLOTS } from '@/src/models/workshop/MotBooking';
import type { Customer } from '@/src/services/CustomerService';
import type { Vehicle } from '@/src/models/workshop';
import type { MotBookingFiltersState, MotBookingFormData } from './types';

export function defaultFilters(): MotBookingFiltersState {
  return {
    searchTerm: '',
    status: 'all',
    testType: 'all',
    dateFrom: '',
    dateTo: '',
  };
}

export function emptyMotBookingFormData(): MotBookingFormData {
  const today = new Date().toISOString().split('T')[0];
  const firstSlot = MOT_TIME_SLOTS[0];
  return {
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleId: '',
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    bookingDate: today,
    startTime: firstSlot.start,
    endTime: firstSlot.end,
    testType: 'standard',
    status: 'scheduled',
    price: 54.85,
    mileage: '',
    motExpiryDate: '',
    assignedTechnicianId: '',
    notes: '',
    resultNotes: '',
    workOrderId: '',
  };
}

export function bookingToFormData(booking: MotBooking): MotBookingFormData {
  return {
    customerId: booking.customer_id || '',
    customerName: booking.customer_name || '',
    customerPhone: booking.customer_phone || '',
    customerEmail: booking.customer_email || '',
    vehicleId: booking.vehicle_id || '',
    vehicleRegistration: booking.vehicle_registration || '',
    vehicleMake: booking.vehicle_make || '',
    vehicleModel: booking.vehicle_model || '',
    bookingDate: booking.booking_date?.slice(0, 10) || '',
    startTime: booking.start_time || '',
    endTime: booking.end_time || '',
    testType: booking.test_type || 'standard',
    status: booking.status || 'scheduled',
    price: Number(booking.price) || 0,
    mileage: booking.mileage || '',
    motExpiryDate: booking.mot_expiry_date?.slice(0, 10) || '',
    assignedTechnicianId: booking.assigned_technician_id || '',
    notes: booking.notes || '',
    resultNotes: booking.result_notes || '',
    workOrderId: booking.work_order_id || '',
  };
}

export function customerToFormPatch(customer: Customer | null): Partial<MotBookingFormData> {
  if (!customer) {
    return {
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    };
  }
  return {
    customerId: customer.id,
    customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    customerPhone: customer.phone || customer.mobile || '',
    customerEmail: customer.email || '',
  };
}

export function vehicleToFormPatch(vehicle: Vehicle | null): Partial<MotBookingFormData> {
  if (!vehicle) {
    return {
      vehicleId: '',
      vehicleRegistration: '',
      vehicleMake: '',
      vehicleModel: '',
      mileage: '',
    };
  }
  return {
    vehicleId: vehicle.id,
    vehicleRegistration: vehicle.registration_number || '',
    vehicleMake: vehicle.make || '',
    vehicleModel: vehicle.model || '',
    mileage: vehicle.mileage || '',
  };
}

export function formDataToPayload(formData: MotBookingFormData): MotBookingCreate {
  return {
    customer_id: formData.customerId || undefined,
    customer_name: formData.customerName || undefined,
    customer_phone: formData.customerPhone || undefined,
    customer_email: formData.customerEmail || undefined,
    vehicle_id: formData.vehicleId || undefined,
    vehicle_registration: formData.vehicleRegistration || undefined,
    vehicle_make: formData.vehicleMake || undefined,
    vehicle_model: formData.vehicleModel || undefined,
    booking_date: formData.bookingDate,
    start_time: formData.startTime,
    end_time: formData.endTime,
    test_type: formData.testType as MotTestType,
    status: formData.status as MotBookingStatus,
    price: formData.price,
    mileage: formData.mileage || undefined,
    mot_expiry_date: formData.motExpiryDate || undefined,
    assigned_technician_id: formData.assignedTechnicianId || undefined,
    notes: formData.notes || undefined,
    result_notes: formData.resultNotes || undefined,
    work_order_id: formData.workOrderId || undefined,
  };
}

export function filterBookings(
  bookings: MotBooking[],
  filters: MotBookingFiltersState,
): MotBooking[] {
  const term = filters.searchTerm.trim().toLowerCase();
  return bookings.filter((b) => {
    if (term) {
      const haystack = [
        b.customer_name,
        b.customer_phone,
        b.vehicle_registration,
        b.vehicle_make,
        b.vehicle_model,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.status !== 'all' && b.status !== filters.status) return false;
    if (filters.testType !== 'all' && b.test_type !== filters.testType) return false;
    if (filters.dateFrom && b.booking_date.slice(0, 10) < filters.dateFrom) return false;
    if (filters.dateTo && b.booking_date.slice(0, 10) > filters.dateTo) return false;
    return true;
  });
}

export function applyTimeSlot(
  formData: MotBookingFormData,
  slotKey: string,
): MotBookingFormData {
  const slot = MOT_TIME_SLOTS.find((s) => `${s.start}-${s.end}` === slotKey);
  if (!slot) return formData;
  return { ...formData, startTime: slot.start, endTime: slot.end };
}

export function timeSlotKey(formData: MotBookingFormData): string {
  return `${formData.startTime}-${formData.endTime}`;
}

export function formatBookingDateTime(booking: MotBooking): string {
  const date = booking.booking_date?.slice(0, 10) || '';
  if (!date) return '—';
  return `${date} ${booking.start_time} – ${booking.end_time}`;
}
