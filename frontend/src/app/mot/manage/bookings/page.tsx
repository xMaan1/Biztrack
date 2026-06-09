'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/src/components/layout';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { useMotBookingsPage } from '@/src/hooks/useMotBookingsPage';
import { MotBookingsLoadingState } from '@/src/components/mot-bookings/MotBookingsLoadingState';
import { MotBookingsPageHeader } from '@/src/components/mot-bookings/MotBookingsPageHeader';
import { MotBookingsStatsCard } from '@/src/components/mot-bookings/MotBookingsStatsCard';
import { MotBookingsFiltersCard } from '@/src/components/mot-bookings/MotBookingsFiltersCard';
import { MotBookingsListCard } from '@/src/components/mot-bookings/MotBookingsListCard';
import { MotBookingFormDialog } from '@/src/components/mot-bookings/MotBookingFormDialog';
import { MotBookingViewDialog } from '@/src/components/mot-bookings/MotBookingViewDialog';
import { MotBookingDeleteDialog } from '@/src/components/mot-bookings/MotBookingDeleteDialog';

function MotManageBookingsContent() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const page = useMotBookingsPage();

  if (page.loading) {
    return <MotBookingsLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-6">
        <MotBookingsPageHeader />

        <MotBookingsStatsCard stats={page.stats} />

        <MotBookingsFiltersCard
          filters={page.filters}
          onFiltersChange={(patch) => page.setFilters((prev) => ({ ...prev, ...patch }))}
          onClear={page.clearFilters}
        />

        <MotBookingsListCard
          bookings={page.filteredBookings}
          totalCount={page.totalCount}
          filters={page.filters}
          formatCurrency={formatCurrency}
          onAddBooking={() => router.push('/mot/book')}
          onView={page.setViewingBooking}
          onEdit={page.handleEdit}
          onDelete={page.handleDeleteClick}
          onStatusChange={page.handleStatusChange}
        />

        <MotBookingFormDialog
          open={page.isDialogOpen}
          editingBooking={page.editingBooking}
          formData={page.formData}
          saving={page.saving}
          onOpenChange={page.handleDialogClose}
          onFormChange={(patch) => page.setFormData((prev) => ({ ...prev, ...patch }))}
          onTimeSlotChange={page.handleTimeSlotChange}
          onSubmit={page.handleSubmit}
        />

        <MotBookingViewDialog
          booking={page.viewingBooking}
          formatCurrency={formatCurrency}
          onClose={() => page.setViewingBooking(null)}
          onEdit={page.handleEdit}
        />

        <MotBookingDeleteDialog
          open={page.isDeleteDialogOpen}
          customerName={page.bookingToDelete?.customer_name}
          onOpenChange={(open) => !open && page.handleDeleteCancel()}
          onConfirm={page.handleDeleteConfirm}
          onCancel={page.handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
}

export default function MotManageBookingsPage() {
  return <MotManageBookingsContent />;
}
