'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { useAuth } from '@/src/hooks/useAuth';
import { apiService } from '@/src/services/ApiService';
import {
  Product,
  ProductCategory,
  UnitOfMeasure,
} from '@/src/models/pos';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: ProductCategory;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unitOfMeasure: UnitOfMeasure;
  barcode: string;
  expiryDate: string;
  batchNumber: string;
  serialNumber: string;
}

const POSProducts = () => {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    ProductCategory.OTHER,
  );
  const [showLowStock, setShowLowStock] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    category: ProductCategory.OTHER,
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    unitOfMeasure: UnitOfMeasure.PIECE,
    barcode: '',
    expiryDate: '',
    batchNumber: '',
    serialNumber: '',
  });

  const categories = Object.values(ProductCategory);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/pos/products');
      setProducts(response.products || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (editingProduct && editingProduct.id) {
        // Update existing product
        await apiService.put(`/pos/products/${editingProduct.id}`, formData);
      } else {
        // Create new product
        await apiService.post('/pos/products', formData);
      }

      // Close dialog and reset state
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: ProductCategory.OTHER,
        unitPrice: 0,
        costPrice: 0,
        stockQuantity: 0,
        minStockLevel: 5,
        unitOfMeasure: UnitOfMeasure.PIECE,
        barcode: '',
        expiryDate: '',
        batchNumber: '',
        serialNumber: '',
      });
      fetchProducts();
    } catch (error) {
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      unitOfMeasure: product.unitOfMeasure || UnitOfMeasure.PIECE,
      barcode: product.barcode || '',
      expiryDate: product.expiryDate || '',
      batchNumber: product.batchNumber || '',
      serialNumber: product.serialNumber || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await apiService.delete(`/pos/products/${productToDelete.id}`);
      fetchProducts();
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: ProductCategory.OTHER,
      unitPrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      unitOfMeasure: UnitOfMeasure.PIECE,
      barcode: '',
      expiryDate: '',
      batchNumber: '',
      serialNumber: '',
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Dialog is being closed, reset editing state
      setEditingProduct(null);
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const openNewProductDialog = () => {
    setEditingProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode &&
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === ProductCategory.OTHER ||
      product.category === selectedCategory;

    const matchesLowStock =
      !showLowStock || product.stockQuantity <= product.minStockLevel;

    return matchesSearch && matchesCategory && matchesLowStock;
  });


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>

          <Button onClick={openNewProductDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value: string) =>
                    setSelectedCategory(value as ProductCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProductCategory.OTHER}>
                      All Categories
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Status</Label>
                <Select
                  value={showLowStock ? 'low' : 'all'}
                  onValueChange={(value) => setShowLowStock(value === 'low')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="low">Low Stock Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(ProductCategory.OTHER);
                    setShowLowStock(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      SKU: {product.sku}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-semibold">
                    {formatCurrency(product.unitPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{product.stockQuantity}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.unitOfMeasure || UnitOfMeasure.PIECE}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Category
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>

                {product.stockQuantity <= product.minStockLevel && (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">Low Stock</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Added: {formatDate(product.createdAt)}</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm || selectedCategory || showLowStock
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first product.'}
            </p>
            {!searchTerm && !selectedCategory && !showLowStock && (
              <Button onClick={openNewProductDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        )}

        {/* Add/Edit Product Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Update the product information below.'
                  : 'Fill in the product details to add it to your catalog.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        category: value as ProductCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                  <Select
                    value={formData.unitOfMeasure}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        unitOfMeasure: value as UnitOfMeasure,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UnitOfMeasure).map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Low Stock Threshold</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockLevel: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="Product barcode..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNumber: e.target.value })
                    }
                    placeholder="Batch number..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    placeholder="Serial number..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Product Modal */}
        <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the product
              </DialogDescription>
            </DialogHeader>

            {viewingProduct && (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Product Name</Label>
                    <p className="text-lg font-semibold">{viewingProduct.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SKU</Label>
                    <p className="text-lg font-mono">{viewingProduct.sku}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-gray-900 mt-1">{viewingProduct.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <Badge variant="outline" className="mt-1">
                      {viewingProduct.category}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Unit of Measure</Label>
                    <p className="text-gray-900 mt-1">{viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}</p>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pricing Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Unit Price</Label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(viewingProduct.unitPrice)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cost Price</Label>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(viewingProduct.costPrice)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-sm font-medium text-gray-600">Profit Margin</Label>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(viewingProduct.unitPrice - viewingProduct.costPrice)} 
                      ({(((viewingProduct.unitPrice - viewingProduct.costPrice) / viewingProduct.costPrice) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Stock Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Current Stock</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {viewingProduct.stockQuantity} {viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Minimum Stock Level</Label>
                      <p className="text-2xl font-bold text-orange-600">
                        {viewingProduct.minStockLevel} {viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}
                      </p>
                    </div>
                  </div>
                  {viewingProduct.stockQuantity <= viewingProduct.minStockLevel && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Low Stock Alert</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        This product is {viewingProduct.stockQuantity < viewingProduct.minStockLevel ? 'below' : 'at'} the minimum stock level. 
                        Consider restocking soon.
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Barcode</Label>
                      <p className="text-gray-900 mt-1 font-mono">{viewingProduct.barcode || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Batch Number</Label>
                      <p className="text-gray-900 mt-1">{viewingProduct.batchNumber || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Serial Number</Label>
                      <p className="text-gray-900 mt-1">{viewingProduct.serialNumber || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                      <p className="text-gray-900 mt-1">{viewingProduct.expiryDate ? formatDate(viewingProduct.expiryDate) : 'Not set'}</p>
                    </div>
                  </div>
                </div>

                {/* Product Status */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Product Status</Label>
                      <div className="mt-1">
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Label className="text-sm font-medium text-gray-600">Created</Label>
                      <p className="text-gray-900 mt-1">{formatDate(viewingProduct.createdAt)}</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setViewingProduct(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setViewingProduct(null);
                handleEdit(viewingProduct!);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default POSProducts;
