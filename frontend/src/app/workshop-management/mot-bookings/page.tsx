'use client';

import { useRouter } from 'next/navigation';
import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import { DashboardLayout } from '@/src/components/layout';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { useMotBookingsPage } from '@/src/hooks/useMotBookingsPage';
import { MotBookingsLoadingState } from '@/src/components/workshop/mot-bookings/MotBookingsLoadingState';
import { MotBookingsPageHeader } from '@/src/components/workshop/mot-bookings/MotBookingsPageHeader';
import { MotBookingsStatsCard } from '@/src/components/workshop/mot-bookings/MotBookingsStatsCard';
import { MotBookingsFiltersCard } from '@/src/components/workshop/mot-bookings/MotBookingsFiltersCard';
import { MotBookingsListCard } from '@/src/components/workshop/mot-bookings/MotBookingsListCard';
import { MotBookingFormDialog } from '@/src/components/workshop/mot-bookings/MotBookingFormDialog';
import { MotBookingViewDialog } from '@/src/components/workshop/mot-bookings/MotBookingViewDialog';
import { MotBookingDeleteDialog } from '@/src/components/workshop/mot-bookings/MotBookingDeleteDialog';

function MotBookingsContent() {
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
          onAddBooking={() => router.push('/workshop-management/mot-bookings/new')}
          onView={page.setViewingBooking}
          onEdit={page.handleEdit}
          onDelete={page.handleDeleteClick}
          onStatusChange={page.handleStatusChange}
        />

        <MotBookingFormDialog
          open={page.isDialogOpen}
          editingBooking={page.editingBooking}
          formData={page.formData}
          users={page.users}
          workOrders={page.workOrders}
          selectedCustomer={page.selectedCustomer}
          selectedVehicle={page.selectedVehicle}
          saving={page.saving}
          onOpenChange={page.handleDialogClose}
          onFormChange={(patch) => page.setFormData((prev) => ({ ...prev, ...patch }))}
          onCustomerSelect={page.handleCustomerSelect}
          onVehicleSelect={page.handleVehicleSelect}
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

export default function MotBookingsPage() {
  return (
    <ModuleGuard module="production">
      <MotBookingsContent />
    </ModuleGuard>
  );
}
