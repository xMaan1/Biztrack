'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Package,
  Plus,
  Search,
  Eye,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardLayout } from '../../../components/layout';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { apiService } from '../../../services/ApiService';
import { Product } from '../../../models/pos';

export default function ProductsPage() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/pos/products');
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0)
      return {
        status: 'out_of_stock',
        color: 'destructive',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    if (quantity <= threshold)
      return {
        status: 'low_stock',
        color: 'secondary',
        icon: <TrendingUp className="h-4 w-4" />,
      };
    return {
      status: 'in_stock',
      color: 'default',
      icon: <CheckCircle className="h-4 w-4" />,
    };
  };

  const getStockStatusLabel = (quantity: number, threshold: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              View and manage your product catalog and inventory levels
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/pos/products')}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Manage in POS
            </Button>
            <Button onClick={() => router.push('/pos/products')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(
                      product.stockQuantity,
                      product.minStockLevel,
                    );
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {stockStatus.icon}
                              <span className="font-medium">
                                {product.stockQuantity}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / {product.minStockLevel || 0} min
                              </span>
                            </div>
                            <Badge variant={stockStatus.color as any}>
                              {getStockStatusLabel(
                                product.stockQuantity,
                                product.minStockLevel,
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(product.unitPrice || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Cost: {formatCurrency(product.costPrice || 0)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/pos/products/${product.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            {product.stockQuantity <=
                              (product.minStockLevel || 0) && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push('/inventory/purchase-orders/new')
                                }
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Order
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first product'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push('/pos/products')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">All products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  products.filter((p) => p.stockQuantity > p.minStockLevel)
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Well stocked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {
                  products.filter(
                    (p) =>
                      p.stockQuantity > 0 &&
                      p.stockQuantity <= p.minStockLevel,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Need reordering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter((p) => p.stockQuantity === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Critical items</p>
            </CardContent>
          </Card>
        </div>

        {/* Note about POS Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Products are managed in the POS module
              </h3>
              <p className="text-muted-foreground mb-4">
                To add, edit, or manage products, please use the POS module
                which provides full product management capabilities.
              </p>
              <Button onClick={() => router.push('/pos/products')}>
                Go to POS Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
