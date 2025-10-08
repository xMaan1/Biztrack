'use client';

import React, { useEffect, useState } from 'react';
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
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import HRMService from '../../../services/HRMService';
import { Supplier, SupplierUpdate } from '../../../models/hrm';
import { DashboardLayout } from '../../../components/layout';
import { formatDate } from '../../../utils/utils';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const { } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [editFormData, setEditFormData] = useState<SupplierUpdate>({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await HRMService.getSuppliers();
      setSuppliers(response.suppliers);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to load suppliers';
      toast.error(`Load Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openDeleteDialog = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await HRMService.deleteSupplier(supplierToDelete.id);
      fetchSuppliers();
      closeDeleteDialog();
      toast.success('Supplier deleted successfully');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete supplier';
      toast.error(`Delete Error: ${errorMessage}`);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setEditFormData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      postalCode: supplier.postalCode || '',
      website: supplier.website || '',
      paymentTerms: supplier.paymentTerms || '',
      creditLimit: supplier.creditLimit || 0,
      isActive: supplier.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSupplierToEdit(null);
    setEditFormData({});
  };

  const handleEditInputChange = (field: keyof SupplierUpdate, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async () => {
    if (!supplierToEdit) return;

    try {
      setEditLoading(true);
      await HRMService.updateSupplier(supplierToEdit.id, editFormData);
      fetchSuppliers();
      closeEditDialog();
      toast.success('Supplier updated successfully');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update supplier';
      toast.error(`Update Error: ${errorMessage}`);
    } finally {
      setEditLoading(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your supplier relationships and vendor information
            </p>
          </div>
          <Button onClick={() => router.push('/hrm/suppliers/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, code, contact person, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSuppliers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            {supplier.website && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {supplier.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.contactPerson && (
                            <div className="text-sm font-medium">
                              {supplier.contactPerson}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {supplier.city && supplier.state && (
                            <div>
                              {supplier.city}, {supplier.state}
                            </div>
                          )}
                          {supplier.country && (
                            <div className="text-muted-foreground">
                              {supplier.country}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.isActive ? 'default' : 'secondary'}
                        >
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(supplier.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Get started by adding your first supplier'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => router.push('/hrm/suppliers/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Suppliers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">Vendor partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Suppliers
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suppliers.filter((s) => s.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                International
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  suppliers.filter(
                    (s) => s.country && s.country !== 'United States',
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Overseas vendors</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the supplier information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editFormData.name || ''}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={editFormData.code || ''}
                  onChange={(e) => handleEditInputChange('code', e.target.value)}
                  placeholder="Supplier code"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={editFormData.contactPerson || ''}
                  onChange={(e) => handleEditInputChange('contactPerson', e.target.value)}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  placeholder="contact@supplier.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editFormData.website || ''}
                  onChange={(e) => handleEditInputChange('website', e.target.value)}
                  placeholder="https://supplier.com"
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editFormData.address || ''}
                onChange={(e) => handleEditInputChange('address', e.target.value)}
                placeholder="Street address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editFormData.city || ''}
                  onChange={(e) => handleEditInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editFormData.state || ''}
                  onChange={(e) => handleEditInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={editFormData.postalCode || ''}
                  onChange={(e) => handleEditInputChange('postalCode', e.target.value)}
                  placeholder="ZIP/Postal code"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={editFormData.country || ''}
                onChange={(e) => handleEditInputChange('country', e.target.value)}
                placeholder="Country"
              />
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={editFormData.paymentTerms || ''}
                  onChange={(e) => handleEditInputChange('paymentTerms', e.target.value)}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={editFormData.creditLimit || ''}
                  onChange={(e) => handleEditInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={editFormData.isActive || false}
                onCheckedChange={(checked) => handleEditInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active Supplier</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                  Updating...
                </>
              ) : (
                'Update Supplier'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{supplierToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
