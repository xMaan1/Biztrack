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
import { Badge } from '@/src/components/ui/badge';
import type { MotBooking } from '@/src/models/workshop/MotBooking';
import {
  getMotStatusColor,
  getMotStatusLabel,
  getMotTestTypeLabel,
  formatMotVehicleLine,
} from '@/src/models/workshop/MotBooking';
import { formatBookingDateTime } from './motBookingUtils';

type MotBookingViewDialogProps = {
  booking: MotBooking | null;
  formatCurrency: (value: number) => string;
  onClose: () => void;
  onEdit: (booking: MotBooking) => void;
};

export function MotBookingViewDialog({
  booking,
  formatCurrency,
  onClose,
  onEdit,
}: MotBookingViewDialogProps) {
  if (!booking) return null;

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>MOT Booking Details</DialogTitle>
          <DialogDescription>
            {formatBookingDateTime(booking)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={getMotStatusColor(booking.status)}>
              {getMotStatusLabel(booking.status)}
            </Badge>
            <Badge variant="outline">{getMotTestTypeLabel(booking.test_type)}</Badge>
          </div>

          <div>
            <div className="font-medium text-muted-foreground">Customer</div>
            <div>{booking.customer_name}</div>
            {booking.customer_phone && <div>{booking.customer_phone}</div>}
            {booking.customer_email && <div>{booking.customer_email}</div>}
          </div>

          <div>
            <div className="font-medium text-muted-foreground">Vehicle</div>
            <div>{formatMotVehicleLine(booking)}</div>
            {booking.mileage && <div>Mileage: {booking.mileage}</div>}
            {booking.mot_expiry_date && (
              <div>MOT expires: {booking.mot_expiry_date.slice(0, 10)}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-muted-foreground">Price</div>
              <div>{formatCurrency(Number(booking.price) || 0)}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Technician</div>
              <div>{booking.technician_name || 'Unassigned'}</div>
            </div>
          </div>

          {booking.notes && (
            <div>
              <div className="font-medium text-muted-foreground">Notes</div>
              <div className="whitespace-pre-wrap">{booking.notes}</div>
            </div>
          )}

          {booking.result_notes && (
            <div>
              <div className="font-medium text-muted-foreground">Result notes</div>
              <div className="whitespace-pre-wrap">{booking.result_notes}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(booking)}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
