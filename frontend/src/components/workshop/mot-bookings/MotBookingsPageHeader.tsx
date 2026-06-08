'use client';

import Link from 'next/link';
import { ClipboardCheck, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function MotBookingsPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ClipboardCheck className="h-8 w-8" />
          MOT Checkup Bookings
        </h1>
        <p className="text-muted-foreground">
          Schedule and manage MOT test appointments for workshop customers
        </p>
      </div>
      <Button asChild>
        <Link href="/workshop-management/mot-bookings/new">
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Link>
      </Button>
    </div>
  );
}
