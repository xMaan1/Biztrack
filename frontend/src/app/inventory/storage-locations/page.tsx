'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Building2,
  Package,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { inventoryService } from '../../../services/InventoryService';
import {
  StorageLocation,
  Warehouse,
  StorageLocationCreate,
} from '../../../models/inventory';
import { DashboardLayout } from '../../../components/layout';
import { formatDate } from '../../../utils/date';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { 
  PageHeader, 
  DataTable, 
  SearchFilterBar, 
  FormModal, 
  DeleteConfirmationModal,
  ErrorHandlerProvider,
  useAsyncErrorHandler
} from '../../../components/common';

function StorageLocationsPageContent() {
  const { } = useAuth();
  const router = useRouter();
  const { handleAsync, showSuccess, showError } = useAsyncErrorHandler();
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(
    [],
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<StorageLocation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLocation, setNewLocation] = useState<StorageLocationCreate>({
    warehouseId: '',
    name: '',
    code: '',
    description: '',
    locationType: 'shelf',
    parentLocationId: '',
    capacity: undefined,
    usedCapacity: undefined,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await handleAsync(async () => {
      setLoading(true);
      const [locationsResponse, warehousesResponse] = await Promise.all([
        inventoryService.getStorageLocations(),
        inventoryService.getWarehouses(),
      ]);
      setStorageLocations(locationsResponse.storageLocations);
      setWarehouses(warehousesResponse.warehouses);

      if (
        warehousesResponse.warehouses.length > 0 &&
        !newLocation.warehouseId
      ) {
        setNewLocation((prev) => ({
          ...prev,
          warehouseId: warehousesResponse.warehouses[0].id,
        }));
      }
    }, 'Failed to load storage locations. Please try again.');

    setLoading(false);
  };

  const filteredLocations = storageLocations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse =
      warehouseFilter === 'all' ||
      !warehouseFilter ||
      location.warehouseId === warehouseFilter;

    return matchesSearch && matchesWarehouse;
  });

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  const openDeleteDialog = (location: StorageLocation) => {
    setLocationToDelete(location);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;
    
    await handleAsync(async () => {
      setDeleteLoading(true);
      await inventoryService.deleteStorageLocation(locationToDelete.id);
      showSuccess('Storage location deleted successfully');
      fetchData();
      closeDeleteDialog();
    }, 'Failed to delete storage location. Please try again.');

    setDeleteLoading(false);
  };

  const getLocationTypeBadge = (type: string) => {
    const typeConfig = {
      shelf: { variant: 'default', label: 'Shelf' },
      rack: { variant: 'secondary', label: 'Rack' },
      bin: { variant: 'outline', label: 'Bin' },
      area: { variant: 'outline', label: 'Area' },
      zone: { variant: 'outline', label: 'Zone' },
      room: { variant: 'outline', label: 'Room' },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.area;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getCapacityPercentage = (used: number, total: number) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  const handleAddLocation = async () => {
    if (!newLocation.warehouseId || !newLocation.name || !newLocation.code) {
      showError('Please fill in all required fields', 'toast');
      return;
    }

    await handleAsync(async () => {
      setIsSubmitting(true);
      await inventoryService.createStorageLocation(newLocation);
      showSuccess('Storage location created successfully');
      setIsAddModalOpen(false);
      setNewLocation({
        warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
        name: '',
        code: '',
        description: '',
        locationType: 'shelf',
        parentLocationId: '',
        capacity: undefined,
        usedCapacity: undefined,
        isActive: true,
      });
      fetchData();
    }, 'Failed to create storage location. Please try again.');

    setIsSubmitting(false);
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
        <PageHeader
          title="Storage Locations"
          description="Manage storage locations and organize your warehouse space"
          actions={[
            {
              label: 'Add Location',
              onClick: () => setIsAddModalOpen(true),
              icon: <Plus className="mr-2 h-4 w-4" />
            }
          ]}
        />

        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, code, or description..."
          filters={[
            {
              key: 'warehouse',
              label: 'Filter by warehouse',
              options: [
                { value: 'all', label: 'All Warehouses' },
                ...warehouses.map(warehouse => ({
                  value: warehouse.id,
                  label: warehouse.name
                }))
              ]
            }
          ]}
          onFilterChange={(key, value) => {
            if (key === 'warehouse') {
              setWarehouseFilter(value);
            }
          }}
        />

        <DataTable
          data={filteredLocations}
          columns={[
            {
              key: 'name',
              label: 'Location',
              render: (_, row) => (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Code: {row.code}
                    </div>
                    {row.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-48">
                        {row.description}
                      </div>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'warehouseId',
              label: 'Warehouse',
              render: (value) => (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{getWarehouseName(value)}</span>
                </div>
              )
            },
            {
              key: 'locationType',
              label: 'Type',
              render: (value) => getLocationTypeBadge(value)
            },
            {
              key: 'capacity',
              label: 'Capacity',
              render: (_, row) => (
                <div className="space-y-2">
                  {row.capacity && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {row.usedCapacity || 0} / {row.capacity} m³
                      </span>
                    </div>
                  )}
                  {row.capacity && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${getCapacityPercentage(row.usedCapacity || 0, row.capacity)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'isActive',
              label: 'Status',
              render: (value) => (
                <Badge variant={value ? 'default' : 'secondary'}>
                  {value ? 'Active' : 'Inactive'}
                </Badge>
              )
            },
            {
              key: 'createdAt',
              label: 'Created',
              render: (value) => (
                <div className="text-sm text-muted-foreground">
                  {formatDate(value)}
                </div>
              )
            }
          ]}
          actions={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              variant: 'outline',
              onClick: (row) => router.push(`/inventory/storage-locations/${row.id}/edit`)
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'outline',
              onClick: (row) => openDeleteDialog(row)
            }
          ]}
          emptyState={{
            icon: <MapPin className="h-12 w-12" />,
            title: 'No storage locations found',
            description: searchTerm || warehouseFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Get started by adding your first storage location',
            action: !searchTerm && warehouseFilter === 'all' ? {
              label: 'Add Storage Location',
              onClick: () => setIsAddModalOpen(true)
            } : undefined
          }}
        />

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Locations
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageLocations.length}
              </div>
              <p className="text-xs text-muted-foreground">All locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Locations
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageLocations.filter((l) => l.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Capacity
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageLocations
                  .reduce((sum, l) => sum + (l.capacity || 0), 0)
                  .toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Cubic meters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Used Capacity
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageLocations
                  .reduce((sum, l) => sum + (l.usedCapacity || 0), 0)
                  .toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Cubic meters</p>
            </CardContent>
          </Card>
        </div>

        <FormModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          title="Add New Storage Location"
          onSubmit={handleAddLocation}
          loading={isSubmitting}
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select
                  value={newLocation.warehouseId}
                  onValueChange={(value) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      warehouseId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type *</Label>
                <Select
                  value={newLocation.locationType}
                  onValueChange={(value) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      locationType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shelf">Shelf</SelectItem>
                    <SelectItem value="rack">Rack</SelectItem>
                    <SelectItem value="bin">Bin</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                    <SelectItem value="zone">Zone</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter location name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={newLocation.code}
                  onChange={(e) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="Enter location code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newLocation.description || ''}
                onChange={(e) =>
                  setNewLocation((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter location description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (m³)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.1"
                  value={newLocation.capacity || ''}
                  onChange={(e) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      capacity: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Enter capacity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usedCapacity">Used Capacity (m³)</Label>
                <Input
                  id="usedCapacity"
                  type="number"
                  step="0.1"
                  value={newLocation.usedCapacity || ''}
                  onChange={(e) =>
                    setNewLocation((prev) => ({
                      ...prev,
                      usedCapacity: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Enter used capacity"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newLocation.isActive}
                onChange={(e) =>
                  setNewLocation((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </FormModal>

        <DeleteConfirmationModal
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          title="Delete Storage Location"
          description="Are you sure you want to delete"
          itemName={locationToDelete?.name}
          loading={deleteLoading}
        />
      </div>
    </DashboardLayout>
  );
}

export default function StorageLocationsPage() {
  return (
    <ErrorHandlerProvider defaultErrorType="toast">
      <StorageLocationsPageContent />
    </ErrorHandlerProvider>
  );
}
