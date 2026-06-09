'use client';

import Link from 'next/link';
import { ClipboardCheck, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function MotBookingsPageHeader() {
  const publicBookingUrl = '/mot/book';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ClipboardCheck className="h-8 w-8" />
          MOT Bookings
        </h1>
        <p className="text-muted-foreground">
          Manage standalone MOT test appointments
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Public booking URL:{' '}
          <Link href={publicBookingUrl} target="_blank" className="font-medium text-primary hover:underline">
            {typeof window !== 'undefined' ? `${window.location.origin}${publicBookingUrl}` : publicBookingUrl}
          </Link>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={publicBookingUrl} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Public Booking
          </Link>
        </Button>
        <Button asChild>
          <Link href={publicBookingUrl}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>
    </div>
  );
}
