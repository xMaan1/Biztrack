'use client';

import type { MotBooking } from '@/src/models/workshop/MotBooking';
import { getVehicleBrandStyle } from './motBrandStyle';
import {
  formatBookingDateTime,
  getDeliveryOptionLabel,
} from './wizardUtils';
import { MOT_INSPECTION_PRICE } from './wizardTypes';

type MotBookingPrintSheetProps = {
  booking: MotBooking;
};

export function MotBookingPrintSheet({ booking }: MotBookingPrintSheetProps) {
  const meta = (booking.booking_meta || {}) as Record<string, unknown>;
  const customer = (meta.customer || {}) as Record<string, string>;
  const retailer = (meta.retailer || {}) as Record<string, string>;
  const brand = getVehicleBrandStyle(booking.vehicle_make || '');
  const bookingRef = booking.id.slice(0, 8).toUpperCase();

  return (
    <div id="mot-print-sheet" className="hidden print:fixed print:inset-0 print:z-[9999] print:block print:bg-white print:p-8">
      <div className="mx-auto max-w-[800px] border-2 border-slate-200 bg-white p-8 font-sans text-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              MOT Test Booking
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Booking Confirmation</h1>
            <p className="mt-1 text-sm text-slate-600">Reference: MOT-{bookingRef}</p>
          </div>
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${brand.gradient} text-white shadow-lg`}
          >
            <span className="text-lg font-black tracking-wider">{brand.initials}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Vehicle
            </h2>
            <p className="text-lg font-bold uppercase">
              {[booking.vehicle_make, booking.vehicle_model, booking.vehicle_year]
                .filter(Boolean)
                .join(' ')}
            </p>
            <p className="font-mono text-sm">{booking.vehicle_registration}</p>
            <p className="text-sm text-slate-600">Mileage: {booking.mileage || '—'}</p>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Appointment
            </h2>
            <p className="font-semibold">
              {formatBookingDateTime(
                booking.booking_date?.slice(0, 10) || '',
                booking.start_time,
              )}
            </p>
            <p className="text-sm text-slate-600">
              {getDeliveryOptionLabel(
                (booking.delivery_option as 'drop_off' | 'wait_security' | 'wait_on_site') || '',
              )}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Customer
            </h2>
            <p className="font-semibold">{booking.customer_name}</p>
            <p className="text-sm">{booking.customer_email}</p>
            <p className="text-sm">{booking.customer_phone}</p>
            {(customer.street || customer.town) && (
              <p className="text-sm text-slate-600">
                {[customer.houseNumber, customer.street, customer.town, customer.postcode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              Retailer
            </h2>
            <p className="font-semibold">{booking.retailer_name || retailer.name}</p>
            <p className="text-sm text-slate-600">
              {[retailer.addressLine1, retailer.city, retailer.postcode].filter(Boolean).join(', ')}
            </p>
          </section>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="font-medium">Carry Out MOT Inspection</span>
            <span className="font-bold">£{Number(booking.price || MOT_INSPECTION_PRICE).toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-lg font-black">
            <span>TOTAL</span>
            <span>£{Number(booking.price || MOT_INSPECTION_PRICE).toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">*Payable at your selected retailer</p>
        </div>

        <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Status</p>
            <p className="font-bold uppercase">{booking.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Powered by BizTrack Workshop</p>
            <p className="text-xs text-slate-400">
              Printed {new Date().toLocaleString('en-GB')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function printMotBooking() {
  window.print();
}
