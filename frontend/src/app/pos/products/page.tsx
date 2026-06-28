'use client';

import { DashboardLayout } from '@/src/components/layout';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { usePosProductsPage } from '@/src/hooks/usePosProductsPage';
import { ProductsLoadingState } from '@/src/components/pos/products/ProductsLoadingState';
import { ProductsPageHeader } from '@/src/components/pos/products/ProductsPageHeader';
import { ProductsFiltersCard } from '@/src/components/pos/products/ProductsFiltersCard';
import { ProductsGrid } from '@/src/components/pos/products/ProductsGrid';
import { ProductFormDialog } from '@/src/components/pos/products/ProductFormDialog';
import { ProductViewDialog } from '@/src/components/pos/products/ProductViewDialog';
import { ProductDeleteDialog } from '@/src/components/pos/products/ProductDeleteDialog';
import { AddCategoryDialog } from '@/src/components/pos/products/AddCategoryDialog';
import { SupplierFormDialog } from '@/src/components/hrm/suppliers/SupplierFormDialog';

export default function POSProductsPage() {
  const { formatCurrency } = useCurrency();
  const page = usePosProductsPage();

  if (page.loading) {
    return <ProductsLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-6">
        <ProductsPageHeader onAddProduct={page.openNewProductDialog} />

        <ProductsFiltersCard
          categories={page.categories}
          filters={page.filters}
          onFiltersChange={(patch) => page.setFilters((prev) => ({ ...prev, ...patch }))}
          onClear={page.clearFilters}
        />

        <ProductsGrid
          products={page.filteredProducts}
          filters={page.filters}
          formatCurrency={formatCurrency}
          onAddProduct={page.openNewProductDialog}
          onView={page.setViewingProduct}
          onEdit={page.handleEdit}
          onDelete={page.handleDeleteClick}
        />

        <ProductFormDialog
          open={page.isDialogOpen}
          editingProduct={page.editingProduct}
          formData={page.formData}
          entryMode={page.entryMode}
          codeLookupLoading={page.codeLookupLoading}
          categories={page.categories}
          suppliers={page.suppliers}
          onOpenChange={page.handleDialogClose}
          onEntryModeChange={page.setEntryMode}
          onFormChange={(patch) => page.setFormData((prev) => ({ ...prev, ...patch }))}
          onCodeScan={(code) => void page.handleCodeScan(code)}
          onSubmit={page.handleSubmit}
          onAddCategoryClick={() => page.setIsAddCategoryOpen(true)}
          onAddSupplierClick={() => page.handleAddSupplierDialogOpenChange(true)}
        />

        <ProductViewDialog
          product={page.viewingProduct}
          formatCurrency={formatCurrency}
          onClose={() => page.setViewingProduct(null)}
          onEdit={page.handleEdit}
        />

        <AddCategoryDialog
          open={page.isAddCategoryOpen}
          categoryName={page.newCategoryName}
          loading={page.addCategoryLoading}
          onOpenChange={page.setIsAddCategoryOpen}
          onCategoryNameChange={page.setNewCategoryName}
          onSubmit={page.handleAddCategory}
        />

        <SupplierFormDialog
          open={page.isAddSupplierOpen}
          editingSupplier={null}
          formData={page.supplierFormData}
          submitting={page.addSupplierLoading}
          onOpenChange={page.handleAddSupplierDialogOpenChange}
          onFormChange={page.handleSupplierFormChange}
          onSubmit={page.handleAddSupplier}
          onCancel={page.closeAddSupplierDialog}
        />

        <ProductDeleteDialog
          open={page.isDeleteDialogOpen}
          productName={page.productToDelete?.name}
          onOpenChange={(open) => !open && page.handleDeleteCancel()}
          onConfirm={page.handleDeleteConfirm}
          onCancel={page.handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
}
