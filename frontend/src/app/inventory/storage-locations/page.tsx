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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  MapPin,
  Plus,
  Search,
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
import { formatDate } from '../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

export default function StorageLocationsPage() {
  const { } = useAuth();
  const router = useRouter();
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(
    [],
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    try {
      setLoading(true);
      const [locationsResponse, warehousesResponse] = await Promise.all([
        inventoryService.getStorageLocations(),
        inventoryService.getWarehouses(),
      ]);
      setStorageLocations(locationsResponse.storageLocations);
      setWarehouses(warehousesResponse.warehouses);

      // Set default warehouse if available
      if (
        warehousesResponse.warehouses.length > 0 &&
        !newLocation.warehouseId
      ) {
        setNewLocation((prev) => ({
          ...prev,
          warehouseId: warehousesResponse.warehouses[0].id,
        }));
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this storage location?')) {
      try {
        await inventoryService.deleteStorageLocation(id);
        fetchData();
      } catch (error) {
        }
    }
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
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createStorageLocation(newLocation);
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
    } catch (error) {
      alert('Failed to create storage location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
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
            <h1 className="text-3xl font-bold tracking-tight">
              Storage Locations
            </h1>
            <p className="text-muted-foreground">
              Manage storage locations and organize your warehouse space
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={warehouseFilter}
                onValueChange={setWarehouseFilter}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Storage Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLocations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {location.code}
                            </div>
                            {location.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-48">
                                {location.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{getWarehouseName(location.warehouseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getLocationTypeBadge(location.locationType)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {location.capacity && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {location.usedCapacity || 0} /{' '}
                                {location.capacity} m³
                              </span>
                            </div>
                          )}
                          {location.capacity && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${getCapacityPercentage(location.usedCapacity || 0, location.capacity)}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={location.isActive ? 'default' : 'secondary'}
                        >
                          {location.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(location.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/inventory/storage-locations/${location.id}/edit`,
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(location.id)}
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
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No storage locations found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || warehouseFilter !== 'all'
                    ? 'Try adjusting your search terms or filters'
                    : 'Get started by adding your first storage location'}
                </p>
                {!searchTerm && warehouseFilter === 'all' && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Storage Location
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

        {/* Add Location Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Storage Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
