import type { MotBooking } from '@/src/models/mot/MotBooking';

const BOOKED_STATUSES = new Set([
  'scheduled',
  'confirmed',
  'in_progress',
  'passed',
  'failed',
]);

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getCalendarDateRange(monthsAhead = 6): { dateFrom: string; dateTo: string } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setMonth(to.getMonth() + monthsAhead);
  return {
    dateFrom: formatLocalDate(from),
    dateTo: formatLocalDate(to),
  };
}

export function getBookedDateSet(
  bookings: MotBooking[],
  excludeBookingId?: string | null,
): Set<string> {
  const dates = new Set<string>();
  for (const booking of bookings) {
    if (excludeBookingId && booking.id === excludeBookingId) continue;
    if (!booking.is_active) continue;
    if (!BOOKED_STATUSES.has(booking.status)) continue;
    if (!booking.booking_date) continue;
    dates.add(booking.booking_date.slice(0, 10));
  }
  return dates;
}

export function isDateAvailable(date: Date, bookedDates: Set<string>): boolean {
  return !bookedDates.has(formatLocalDate(date));
}
