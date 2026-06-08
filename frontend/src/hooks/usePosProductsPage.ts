'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/src/services/ApiService';
import HRMService from '@/src/services/HRMService';
import type { Product, POSCategoriesResponse } from '@/src/models/pos';
import type { Supplier } from '@/src/models/hrm/supplier';
import type { ProductFiltersState, ProductFormData } from '@/src/components/pos/products/types';
import {
  defaultFilters,
  emptyProductFormData,
  filterProducts,
  formDataToPayload,
  productToFormData,
} from '@/src/components/pos/products/productUtils';

export function usePosProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProductFormData());

  const fetchCategories = useCallback(async () => {
    try {
      const data: POSCategoriesResponse = await apiService.get('/pos/categories');
      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiService.get('/pos/products');
      setProducts(response.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await HRMService.getSuppliers(0, 500);
      setSuppliers(response.suppliers || []);
    } catch {
      setSuppliers([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, [fetchProducts, fetchCategories, fetchSuppliers]);

  const openNewProductDialog = useCallback(() => {
    setEditingProduct(null);
    setFormData(emptyProductFormData());
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('openAdd') !== 'true') return;
    openNewProductDialog();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('openAdd');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/pos/products?${nextQuery}` : '/pos/products');
  }, [searchParams, router, openNewProductDialog]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setEditingProduct(null);
      setFormData(emptyProductFormData());
    }
    setIsDialogOpen(open);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const payload = formDataToPayload(formData);
      try {
        if (editingProduct?.id) {
          await apiService.put(`/pos/products/${editingProduct.id}`, payload);
        } else {
          await apiService.post('/pos/products', payload);
        }
        setIsDialogOpen(false);
        setEditingProduct(null);
        setFormData(emptyProductFormData());
        await fetchProducts();
      } catch {
      }
    },
    [editingProduct, formData, fetchProducts],
  );

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormData(productToFormData(product));
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await apiService.delete(`/pos/products/${productToDelete.id}`);
      await fetchProducts();
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch {
    }
  }, [productToDelete, fetchProducts]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  }, []);

  const handleAddCategory = useCallback(async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddCategoryLoading(true);
    try {
      await apiService.post('/pos/categories', { name });
      await fetchCategories();
      setFormData((prev) => ({ ...prev, category: name }));
      setNewCategoryName('');
      setIsAddCategoryOpen(false);
    } catch {
    } finally {
      setAddCategoryLoading(false);
    }
  }, [newCategoryName, fetchCategories]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters());
  }, []);

  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [products, filters],
  );

  return {
    products,
    categories,
    suppliers,
    loading,
    filters,
    filteredProducts,
    formData,
    editingProduct,
    viewingProduct,
    productToDelete,
    isDialogOpen,
    isDeleteDialogOpen,
    isAddCategoryOpen,
    newCategoryName,
    addCategoryLoading,
    setFilters,
    setFormData,
    setViewingProduct,
    setIsAddCategoryOpen,
    setNewCategoryName,
    openNewProductDialog,
    handleDialogClose,
    handleSubmit,
    handleEdit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleAddCategory,
    clearFilters,
  };
}
