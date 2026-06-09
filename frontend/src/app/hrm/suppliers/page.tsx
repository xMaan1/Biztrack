'use client';

import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import { DashboardLayout } from '@/src/components/layout';
import { SuppliersLoadingState } from '@/src/components/hrm/suppliers/SuppliersLoadingState';
import { SuppliersPageHeader } from '@/src/components/hrm/suppliers/SuppliersPageHeader';
import { SuppliersSearchCard } from '@/src/components/hrm/suppliers/SuppliersSearchCard';
import { SuppliersListCard } from '@/src/components/hrm/suppliers/SuppliersListCard';
import { SuppliersStatsCards } from '@/src/components/hrm/suppliers/SuppliersStatsCards';
import { SupplierFormDialog } from '@/src/components/hrm/suppliers/SupplierFormDialog';
import { SupplierDeleteDialog } from '@/src/components/hrm/suppliers/SupplierDeleteDialog';
import { useSuppliersPage } from '@/src/hooks/useSuppliersPage';

export default function SuppliersPage() {
  return (
    <ModuleGuard module="hrm" fallback={<div>You don't have access to HRM module</div>}>
      <SuppliersContent />
    </ModuleGuard>
  );
}

function SuppliersContent() {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filteredSuppliers,
    stats,
    showFormDialog,
    editingSupplier,
    formData,
    submitting,
    isDeleteDialogOpen,
    supplierToDelete,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    handleFormInputChange,
    handleFormSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,
    handleFormDialogOpenChange,
    handleDeleteDialogOpenChange,
  } = useSuppliersPage();

  if (loading) {
    return <SuppliersLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-6">
        <SuppliersPageHeader onAddSupplier={openCreateDialog} />
        <SuppliersSearchCard searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
        <SuppliersListCard
          suppliers={filteredSuppliers}
          searchTerm={searchTerm}
          onAddSupplier={openCreateDialog}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
        <SuppliersStatsCards stats={stats} />
      </div>

      <SupplierFormDialog
        open={showFormDialog}
        editingSupplier={editingSupplier}
        formData={formData}
        submitting={submitting}
        onOpenChange={handleFormDialogOpenChange}
        onFormChange={handleFormInputChange}
        onSubmit={handleFormSubmit}
        onCancel={closeFormDialog}
      />

      <SupplierDeleteDialog
        open={isDeleteDialogOpen}
        supplier={supplierToDelete}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </DashboardLayout>
  );
}
