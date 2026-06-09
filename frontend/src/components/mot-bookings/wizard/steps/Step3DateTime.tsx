'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { ArrowLeft, Calendar, ChevronDown, Info } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/src/lib/utils';
import motBookingService from '@/src/services/MotBookingService';
import type { MotWizardDateTime } from '../wizardTypes';
import { MOT_DELIVERY_OPTIONS, MOT_HOURLY_SLOTS } from '../wizardTypes';
import {
  formatLocalDate,
  getBookedDateSet,
  getCalendarDateRange,
  isDateAvailable,
  parseLocalDate,
} from '../motCalendarUtils';

type Step3DateTimeProps = {
  dateTime: MotWizardDateTime;
  onChange: (patch: Partial<MotWizardDateTime>) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Step3DateTime({
  dateTime,
  onChange,
  onBack,
  onNext,
  canNext,
}: Step3DateTimeProps) {
  const searchParams = useSearchParams();
  const amendBookingId = searchParams.get('amend');

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [loadingBookedDates, setLoadingBookedDates] = useState(true);

  const selectedDate = dateTime.bookingDate ? parseLocalDate(dateTime.bookingDate) : null;
  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBookedDates = async () => {
      setLoadingBookedDates(true);
      try {
        const { dateFrom, dateTo } = getCalendarDateRange();
        const response = await motBookingService.getPublicCalendar(dateFrom, dateTo);
        if (cancelled) return;
        setBookedDates(getBookedDateSet(response.bookings || [], amendBookingId));
      } catch {
        if (!cancelled) setBookedDates(new Set());
      } finally {
        if (!cancelled) setLoadingBookedDates(false);
      }
    };

    loadBookedDates();
    return () => {
      cancelled = true;
    };
  }, [amendBookingId]);

  useEffect(() => {
    if (!dateTime.bookingDate) return;
    if (!bookedDates.has(dateTime.bookingDate)) return;
    onChange({ bookingDate: '', bookingTime: '' });
  }, [bookedDates, dateTime.bookingDate, onChange]);

  const filterAvailableDate = useCallback(
    (date: Date) => isDateAvailable(date, bookedDates),
    [bookedDates],
  );

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange({ bookingDate: '', bookingTime: '' });
      return;
    }
    onChange({ bookingDate: formatLocalDate(date) });
    setCalendarOpen(false);
  };

  const openCalendar = () => setCalendarOpen(true);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 03</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Select a Date & Time</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          All fields are mandatory unless otherwise stated.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide">Choose Delivery and Collection Options</h3>
        <div className="space-y-3">
          {MOT_DELIVERY_OPTIONS.map((option) => {
            const selected = dateTime.deliveryOption === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-all',
                  selected
                    ? 'border-primary bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/30 dark:to-purple-950/30'
                    : 'border-border hover:border-primary/30',
                )}
              >
                <input
                  type="radio"
                  name="deliveryOption"
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange({ deliveryOption: option.value })}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-sm leading-relaxed">{option.label}</span>
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold">Date</Label>
          <div className="relative flex h-12 items-center rounded-xl border-2 bg-background px-3 pr-11">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              open={calendarOpen}
              onInputClick={openCalendar}
              onClickOutside={() => setCalendarOpen(false)}
              minDate={minDate}
              filterDate={filterAvailableDate}
              dateFormat="dd/MM/yyyy"
              placeholderText={loadingBookedDates ? 'Loading dates...' : 'Select a Date'}
              disabled={loadingBookedDates}
              className="w-full bg-transparent pr-2 text-sm outline-none"
              wrapperClassName="w-full"
              calendarClassName="mot-booking-datepicker"
            />
            <button
              type="button"
              onClick={openCalendar}
              disabled={loadingBookedDates}
              className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              aria-label="Open calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dates with existing MOT bookings are unavailable.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">Time</Label>
          <Select
            value={dateTime.bookingTime || ''}
            onValueChange={(value) => onChange({ bookingTime: value })}
          >
            <SelectTrigger className="h-12 rounded-xl border-2">
              <SelectValue placeholder="Select a Time" />
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              {MOT_HOURLY_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 rounded-xl gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
