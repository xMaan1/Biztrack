import type { MotBookingStatus, MotTestType } from '@/src/models/workshop/MotBooking';

export type MotBookingFiltersState = {
  searchTerm: string;
  status: MotBookingStatus | 'all';
  testType: MotTestType | 'all';
  dateFrom: string;
  dateTo: string;
};

export type MotBookingFormData = {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleId: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  testType: MotTestType;
  status: MotBookingStatus;
  price: number;
  mileage: string;
  motExpiryDate: string;
  assignedTechnicianId: string;
  notes: string;
  resultNotes: string;
  workOrderId: string;
};
