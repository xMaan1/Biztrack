'use client';

import React, { useState, useEffect } from 'react';
import { ModuleGuard } from '../../components/guards/PermissionGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  MedicalSupply,
  MedicalSupplyCreate,
  MedicalSupplyStats,
  medicalSupplyService,
} from '@/src/services/HealthcareService';
import { DashboardLayout } from '../../components/layout';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function MedicalSuppliesPage() {
  return (
    <ModuleGuard module="inventory" fallback={<div>You don't have access to this module</div>}>
      <MedicalSuppliesContent />
    </ModuleGuard>
  );
}

function MedicalSuppliesContent() {
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [stats, setStats] = useState<MedicalSupplyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState<MedicalSupply | null>(null);
  const [selectedSupply, setSelectedSupply] = useState<MedicalSupply | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<MedicalSupplyCreate>({
    name: '',
    category: '',
    description: '',
    unit: 'piece',
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: undefined,
    unitPrice: 0,
    expiryDate: '',
    batchNumber: '',
    supplier: '',
    location: '',
  });

  const categories = [
    'Medication',
    'Equipment',
    'Supplies',
    'Instruments',
    'Disposables',
    'Diagnostic',
    'Other',
  ];

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadSupplies();
    loadStats();
  }, [currentPage, categoryFilter, lowStockFilter, debouncedSearchTerm]);

  const loadSupplies = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await medicalSupplyService.getMedicalSupplies(
        skip,
        itemsPerPage,
        debouncedSearchTerm || undefined,
        categoryFilter === 'all' ? undefined : categoryFilter,
        lowStockFilter,
      );
      setSupplies(response.supplies);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load medical supplies'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await medicalSupplyService.getMedicalSupplyStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.stockQuantity !== undefined && formData.stockQuantity < 0) errors.stockQuantity = 'Stock quantity cannot be negative';
    if (formData.minStockLevel !== undefined && formData.minStockLevel < 0) errors.minStockLevel = 'Min stock level cannot be negative';
    if (formData.unitPrice !== undefined && formData.unitPrice < 0) errors.unitPrice = 'Unit price cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await medicalSupplyService.createMedicalSupply(formData);
      toast.success('Medical supply created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadSupplies();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create medical supply'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedSupply) return;
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await medicalSupplyService.updateMedicalSupply(selectedSupply.id, formData);
      toast.success('Medical supply updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadSupplies();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update medical supply'));
    }
  };

  const handleDelete = async () => {
    if (!supplyToDelete) return;
    try {
      await medicalSupplyService.deleteMedicalSupply(supplyToDelete.id);
      toast.success('Medical supply deleted successfully');
      setIsDeleteDialogOpen(false);
      setSupplyToDelete(null);
      loadSupplies();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete medical supply'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      unit: 'piece',
      stockQuantity: 0,
      minStockLevel: 0,
      maxStockLevel: undefined,
      unitPrice: 0,
      expiryDate: '',
      batchNumber: '',
      supplier: '',
      location: '',
    });
    setSelectedSupply(null);
    setFormErrors({});
  };

  const openEditDialog = (supply: MedicalSupply) => {
    setSelectedSupply(supply);
    setFormData({
      name: supply.name,
      category: supply.category || '',
      description: supply.description || '',
      unit: supply.unit || 'piece',
      stockQuantity: supply.stockQuantity,
      minStockLevel: supply.minStockLevel,
      maxStockLevel: supply.maxStockLevel,
      unitPrice: supply.unitPrice,
      expiryDate: supply.expiryDate || '',
      batchNumber: supply.batchNumber || '',
      supplier: supply.supplier || '',
      location: supply.location || '',
    });
    setIsEditDialogOpen(true);
  };

  const isLowStock = (supply: MedicalSupply) => {
    return supply.stockQuantity <= supply.minStockLevel;
  };

  const getStockBadge = (supply: MedicalSupply) => {
    if (isLowStock(supply)) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        <Package className="w-3 h-3 mr-1" />
        In Stock
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Supplies</h1>
            <p className="text-gray-600">Manage medical supplies inventory</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Supply
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Medical Supply</DialogTitle>
                <DialogDescription>Add a new medical supply to inventory</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    placeholder="Supply name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="piece, box, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockLevel: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxStockLevel">Max Stock Level</Label>
                  <Input
                    id="maxStockLevel"
                    type="number"
                    value={formData.maxStockLevel || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStockLevel: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
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
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, batchNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Supplies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalValue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byCategory).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Medical Supplies</CardTitle>
                <CardDescription>List of all medical supplies</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search supplies..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 w-64"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={lowStockFilter === undefined ? 'all' : lowStockFilter ? 'low' : 'normal'}
                  onValueChange={(value) => {
                    setLowStockFilter(
                      value === 'all' ? undefined : value === 'low' ? true : false,
                    );
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="normal">Normal Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : supplies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No medical supplies found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supply ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplies.map((supply) => (
                      <TableRow key={supply.id}>
                        <TableCell className="font-medium">{supply.supplyId}</TableCell>
                        <TableCell>{supply.name}</TableCell>
                        <TableCell>
                          {supply.category && (
                            <Badge variant="outline">{supply.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {supply.stockQuantity} {supply.unit}
                        </TableCell>
                        <TableCell>${supply.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{getStockBadge(supply)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(supply)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSupplyToDelete(supply);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} supplies
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Medical Supply</DialogTitle>
              <DialogDescription>Update medical supply information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="piece, box, etc."
                />
              </div>
              <div>
                <Label htmlFor="edit-stockQuantity">Stock Quantity</Label>
                <Input
                  id="edit-stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      stockQuantity: parseInt(e.target.value) || 0,
                    });
                    if (formErrors.stockQuantity) setFormErrors({ ...formErrors, stockQuantity: '' });
                  }}
                  className={formErrors.stockQuantity ? 'border-red-500' : ''}
                />
                {formErrors.stockQuantity && <p className="text-sm text-red-500 mt-1">{formErrors.stockQuantity}</p>}
              </div>
              <div>
                <Label htmlFor="edit-minStockLevel">Min Stock Level</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      minStockLevel: parseInt(e.target.value) || 0,
                    });
                    if (formErrors.minStockLevel) setFormErrors({ ...formErrors, minStockLevel: '' });
                  }}
                  className={formErrors.minStockLevel ? 'border-red-500' : ''}
                />
                {formErrors.minStockLevel && <p className="text-sm text-red-500 mt-1">{formErrors.minStockLevel}</p>}
              </div>
              <div>
                <Label htmlFor="edit-maxStockLevel">Max Stock Level</Label>
                <Input
                  id="edit-maxStockLevel"
                  type="number"
                  value={formData.maxStockLevel || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStockLevel: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-unitPrice">Unit Price</Label>
                <Input
                  id="edit-unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      unitPrice: parseFloat(e.target.value) || 0,
                    });
                    if (formErrors.unitPrice) setFormErrors({ ...formErrors, unitPrice: '' });
                  }}
                  className={formErrors.unitPrice ? 'border-red-500' : ''}
                />
                {formErrors.unitPrice && <p className="text-sm text-red-500 mt-1">{formErrors.unitPrice}</p>}
              </div>
              <div>
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-batchNumber">Batch Number</Label>
                <Input
                  id="edit-batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Medical Supply</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {supplyToDelete?.name}? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

