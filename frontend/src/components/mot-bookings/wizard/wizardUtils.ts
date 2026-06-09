import type {
  MotDeliveryOption,
  MotWizardData,
  MotWizardRetailer,
  MotWizardVehicle,
} from './wizardTypes';
import { MOT_DELIVERY_OPTIONS, MOT_INSPECTION_PRICE } from './wizardTypes';

export const WIZARD_STORAGE_KEY = 'mot_booking_wizard_draft';

export function saveWizardDraft(data: MotWizardData, step: number, vehicleSubStep: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    WIZARD_STORAGE_KEY,
    JSON.stringify({ data, step, vehicleSubStep, savedAt: Date.now() }),
  );
}

export function loadWizardDraft():
  | { data: MotWizardData; step: number; vehicleSubStep: string }
  | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearWizardDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WIZARD_STORAGE_KEY);
}

export function formatVehicleSummary(data: MotWizardData): string {
  const { vehicle } = data;
  const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean);
  if (parts.length) return parts.join(' ').toUpperCase();
  if (vehicle.registration) return vehicle.registration.toUpperCase();
  return '';
}

export function formatRetailerAddress(retailer: MotWizardRetailer): string[] {
  const lines = [
    retailer.name,
    retailer.addressLine1,
    retailer.addressLine2,
    [retailer.city, retailer.county].filter(Boolean).join(', '),
    retailer.postcode,
  ].filter(Boolean);
  return lines;
}

export function getDeliveryOptionLabel(option: MotDeliveryOption | ''): string {
  if (!option) return '';
  return MOT_DELIVERY_OPTIONS.find((o) => o.value === option)?.label ?? '';
}

export function formatBookingDateTime(date: string, time: string): string {
  if (!date) return '';
  const d = new Date(`${date}T${time || '00:00'}:00`);
  if (Number.isNaN(d.getTime())) return `${date}${time ? ` ${time}` : ''}`;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + (time ? ` ${time}` : '');
}

export function calculateTotalCost(data: MotWizardData): number {
  let total = 0;
  if (data.services.motInspection) total += MOT_INSPECTION_PRICE;
  return total;
}

export function isVehicleDetailsComplete(data: MotWizardData): boolean {
  const { vehicle } = data;
  return Boolean(
    vehicle.registration.trim() &&
      vehicle.mileage.trim() &&
      vehicle.make.trim() &&
      vehicle.year.trim(),
  );
}

export function isVehicleModelComplete(data: MotWizardData): boolean {
  return Boolean(data.vehicle.model.trim());
}

export function isRetailerComplete(data: MotWizardData): boolean {
  const { retailer } = data;
  return Boolean(
    retailer.name.trim() &&
      retailer.addressLine1.trim() &&
      retailer.city.trim() &&
      retailer.postcode.trim(),
  );
}

export function isServicesComplete(data: MotWizardData): boolean {
  return data.services.motInspection || data.services.otherServices.trim().length > 0;
}

export function isDateTimeComplete(data: MotWizardData): boolean {
  const { dateTime } = data;
  return Boolean(
    dateTime.deliveryOption &&
      dateTime.bookingDate &&
      dateTime.bookingTime,
  );
}

export function isCustomerDetailsComplete(data: MotWizardData): boolean {
  const { customer } = data;
  return Boolean(
    customer.title &&
      customer.firstName.trim() &&
      customer.lastName.trim() &&
      customer.email.trim() &&
      customer.telephone.trim() &&
      customer.houseNumber.trim() &&
      customer.street.trim() &&
      customer.town.trim() &&
      customer.postcode.trim() &&
      customer.privacyAccepted &&
      customer.termsAccepted,
  );
}

export function formatCustomerName(data: MotWizardData): string {
  const { customer } = data;
  return [customer.title, customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
}

export function formatCustomerAddress(data: MotWizardData): string[] {
  const { customer } = data;
  return [
    [customer.houseNumber, customer.street].filter(Boolean).join(' '),
    customer.town,
    customer.county,
    customer.postcode,
  ].filter(Boolean);
}

export function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const next = (h + 1) * 60 + (m || 0);
  const hours = Math.floor(next / 60) % 24;
  const mins = next % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function wizardDataToBookingPayload(data: MotWizardData) {
  const endTime = addOneHour(data.dateTime.bookingTime);
  const notesParts = [
    data.services.otherServices.trim(),
    data.customer.additionalComments.trim(),
  ].filter(Boolean);

  return {
    customer_name: formatCustomerName(data),
    customer_phone: data.customer.telephone,
    customer_email: data.customer.email,
    vehicle_registration: data.vehicle.registration,
    vehicle_make: data.vehicle.make,
    vehicle_model: data.vehicle.model,
    vehicle_year: data.vehicle.year,
    retailer_id: data.retailer.id || undefined,
    delivery_option: data.dateTime.deliveryOption || undefined,
    booking_date: data.dateTime.bookingDate,
    start_time: data.dateTime.bookingTime,
    end_time: endTime,
    test_type: 'standard' as const,
    status: 'confirmed' as const,
    price: calculateTotalCost(data),
    mileage: data.vehicle.mileage,
    notes: notesParts.join('\n\n') || undefined,
    booking_meta: {
      retailer: data.retailer,
      services: data.services,
      deliveryOption: data.dateTime.deliveryOption,
      customer: data.customer,
      vehicle: data.vehicle,
    },
  };
}

export function bookingToWizardData(booking: import('@/src/models/mot/MotBooking').MotBooking): MotWizardData {
  const meta = (booking.booking_meta || {}) as Record<string, unknown>;
  const customerMeta = (meta.customer || {}) as Partial<MotWizardData['customer']>;
  const retailerMeta = (meta.retailer || {}) as Partial<MotWizardRetailer>;
  const servicesMeta = (meta.services || {}) as Partial<MotWizardData['services']>;
  const vehicleMeta = (meta.vehicle || {}) as Partial<MotWizardVehicle>;

  return {
    vehicle: {
      registration: booking.vehicle_registration || vehicleMeta.registration || '',
      mileage: booking.mileage || vehicleMeta.mileage || '',
      make: booking.vehicle_make || vehicleMeta.make || '',
      year: booking.vehicle_year || vehicleMeta.year || '',
      model: booking.vehicle_model || vehicleMeta.model || '',
    },
    retailer: {
      id: booking.retailer_id || retailerMeta.id || '',
      name: booking.retailer_name || retailerMeta.name || '',
      addressLine1: retailerMeta.addressLine1 || '',
      addressLine2: retailerMeta.addressLine2 || '',
      city: retailerMeta.city || '',
      county: retailerMeta.county || '',
      postcode: retailerMeta.postcode || '',
      phone: retailerMeta.phone || '',
      email: retailerMeta.email || '',
    },
    services: {
      motInspection: servicesMeta.motInspection ?? true,
      motPrice: servicesMeta.motPrice ?? MOT_INSPECTION_PRICE,
      otherServices: servicesMeta.otherServices || booking.notes || '',
    },
    dateTime: {
      deliveryOption: (booking.delivery_option as MotDeliveryOption) || '',
      bookingDate: booking.booking_date?.slice(0, 10) || '',
      bookingTime: booking.start_time || '',
    },
    customer: {
      title: customerMeta.title || '',
      firstName:
        customerMeta.firstName ||
        (booking.customer_name || '').split(' ').slice(1, -1).join(' ') ||
        (booking.customer_name || '').split(' ')[0] ||
        '',
      lastName:
        customerMeta.lastName ||
        (booking.customer_name || '').split(' ').slice(-1)[0] ||
        '',
      email: booking.customer_email || customerMeta.email || '',
      county: customerMeta.county || '',
      telephone: booking.customer_phone || customerMeta.telephone || '',
      houseNumber: customerMeta.houseNumber || '',
      street: customerMeta.street || '',
      town: customerMeta.town || '',
      postcode: customerMeta.postcode || '',
      contactConsent: customerMeta.contactConsent || {
        email: false,
        post: false,
        telephone: false,
        sms: false,
      },
      additionalComments: customerMeta.additionalComments || '',
      privacyAccepted: customerMeta.privacyAccepted ?? false,
      termsAccepted: customerMeta.termsAccepted ?? false,
    },
  };
}

export function retailerToWizard(retailer: {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county?: string;
  postcode: string;
  phone?: string;
  email?: string;
}): MotWizardRetailer {
  return {
    id: retailer.id,
    name: retailer.name,
    addressLine1: retailer.address_line1,
    addressLine2: retailer.address_line2 || '',
    city: retailer.city,
    county: retailer.county || '',
    postcode: retailer.postcode,
    phone: retailer.phone || '',
    email: retailer.email || '',
  };
}

export function wizardRetailerToPayload(retailer: MotWizardRetailer, isDefault: boolean) {
  return {
    name: retailer.name,
    address_line1: retailer.addressLine1,
    address_line2: retailer.addressLine2 || undefined,
    city: retailer.city,
    county: retailer.county || undefined,
    postcode: retailer.postcode,
    phone: retailer.phone || undefined,
    email: retailer.email || undefined,
    is_default: isDefault,
  };
}
