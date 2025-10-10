'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCachedApi } from '../../../hooks/useCachedApi';
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
  ClipboardList,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { inventoryService } from '../../../services/InventoryService';
import HRMService from '../../../services/HRMService';
import {
  PurchaseOrder,
  PurchaseOrderUpdate,
} from '../../../models/inventory';
import { DashboardLayout } from '../../../components/layout';
import { formatDate } from '../../../lib/utils';
import { useCurrency } from '../../../contexts/CurrencyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { toast } from 'sonner';
import PurchaseOrderModal from '../../../components/inventory/PurchaseOrderModal';

export default function PurchaseOrdersPage() {
  const { } = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to reduce filtering operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Use cached API calls with longer TTL for static data
  const { data: suppliersData, loading: suppliersLoading } = useCachedApi(
    'suppliers',
    () => HRMService.getSuppliers(),
    { ttl: 15 * 60 * 1000 } // 15 minutes cache for suppliers
  );

  const { data: warehousesData, loading: warehousesLoading } = useCachedApi(
    'warehouses',
    () => inventoryService.getWarehouses(),
    { ttl: 15 * 60 * 1000 } 
  );

  const { data: purchaseOrdersData, loading: purchaseOrdersLoading, refetch: refetchPurchaseOrders } = useCachedApi(
    'purchase-orders',
    () => inventoryService.getPurchaseOrders(),
    { ttl: 2 * 60 * 1000 } 
  );

  const suppliers = suppliersData?.suppliers || [];
  const warehouses = warehousesData?.warehouses || [];
  const purchaseOrders = purchaseOrdersData?.purchaseOrders || [];
  const isDataLoading = purchaseOrdersLoading || suppliersLoading || warehousesLoading;
  const [editOrder, setEditOrder] = useState<PurchaseOrderUpdate>({
    orderNumber: '',
    supplierId: '',
    supplierName: '',
    warehouseId: '',
    orderDate: '',
    expectedDeliveryDate: '',
    notes: '',
  });



  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || !statusFilter || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, debouncedSearchTerm, statusFilter]);

  const openDeleteModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deletePurchaseOrder(selectedOrder.id);
      toast.success('Purchase order deleted successfully');
      refetchPurchaseOrders();
      closeDeleteModal();
    } catch (error) {
      toast.error('Failed to delete purchase order. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };


  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updateData: PurchaseOrderUpdate = {
        status: newStatus as any,
      };
      
      await inventoryService.updatePurchaseOrder(orderId, updateData);
      toast.success(`Purchase order status updated to ${newStatus}`);
      refetchPurchaseOrders();
    } catch (error) {
      toast.error('Failed to update purchase order status. Please try again.');
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setEditOrder({
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      warehouseId: order.warehouseId,
      orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
      notes: order.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    if (
      !editOrder.orderNumber ||
      !editOrder.supplierId ||
      !editOrder.warehouseId ||
      !editOrder.orderDate ||
      !editOrder.expectedDeliveryDate
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.updatePurchaseOrder(selectedOrder.id, editOrder);
      toast.success('Purchase order updated successfully');
      setIsEditModalOpen(false);
      refetchPurchaseOrders();
    } catch (error) {
      toast.error('Failed to update purchase order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusBadge = useMemo(() => {
    return (status: string) => {
      const statusConfig = {
        draft: { variant: 'secondary', label: 'Draft' },
        submitted: { variant: 'default', label: 'Submitted' },
        approved: { variant: 'default', label: 'Approved' },
        ordered: { variant: 'default', label: 'Ordered' },
        received: { variant: 'default', label: 'Received' },
        cancelled: { variant: 'destructive', label: 'Cancelled' },
      };

      const config =
        statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
      return <Badge variant={config.variant as any}>{config.label}</Badge>;
    };
  }, []);

  const summaryStats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const pendingApproval = purchaseOrders.filter((po) => po.status === 'submitted').length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const thisMonth = purchaseOrders.filter((po) => {
      const created = new Date(po.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

    return { totalPOs, pendingApproval, totalValue, thisMonth };
  }, [purchaseOrders]);

  if (isDataLoading) {
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
              Purchase Orders
            </h1>
            <p className="text-muted-foreground">
              Manage purchase orders and supplier procurement
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create PO
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
                  placeholder="Search by PO number or supplier name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchaseOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.orderNumber}</div>
                        {order.notes && (
                          <div className="text-sm text-muted-foreground truncate max-w-32">
                            {order.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {order.supplierName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(order.expectedDeliveryDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/inventory/purchase-orders/${order.id}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {order.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'ordered')}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              Order
                            </Button>
                          )}
                          {order.status === 'ordered' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'approved')}
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(order)}
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
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No purchase orders found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search terms or filters'
                    : 'Get started by creating your first purchase order'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Purchase Order
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
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalPOs}</div>
              <p className="text-xs text-muted-foreground">
                All purchase orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.pendingApproval}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                All purchase orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.thisMonth}
              </div>
              <p className="text-xs text-muted-foreground">
                Created this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create Purchase Order Modal */}
        <PurchaseOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refetchPurchaseOrders}
          title="Create New Purchase Order"
          showOrderDate={true}
          showSupplierCount={true}
          showAddSupplierButton={true}
          useToastNotifications={true}
        />

        {/* Delete Purchase Order Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Purchase Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete purchase order{' '}
                <strong>{selectedOrder?.orderNumber}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Purchase Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-orderNumber">Order Number *</Label>
                  <Input
                    id="edit-orderNumber"
                    value={editOrder.orderNumber}
                    onChange={(e) =>
                      setEditOrder((prev) => ({
                        ...prev,
                        orderNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter PO number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-orderDate">Order Date *</Label>
                  <Input
                    id="edit-orderDate"
                    type="date"
                    value={editOrder.orderDate}
                    onChange={(e) =>
                      setEditOrder((prev) => ({
                        ...prev,
                        orderDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expectedDeliveryDate">
                    Expected Delivery *
                  </Label>
                  <Input
                    id="edit-expectedDeliveryDate"
                    type="date"
                    value={editOrder.expectedDeliveryDate}
                    onChange={(e) =>
                      setEditOrder((prev) => ({
                        ...prev,
                        expectedDeliveryDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-warehouseId">Warehouse * ({warehouses.length} available)</Label>
                <Select
                  value={editOrder.warehouseId}
                  onValueChange={(value) => {
                    setEditOrder((prev) => ({
                      ...prev,
                      warehouseId: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.length === 0 ? (
                      <SelectItem value="no-warehouses" disabled>
                        No warehouses available
                      </SelectItem>
                    ) : (
                      warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplierId">Supplier * ({suppliers.length} available)</Label>
                <div className="flex gap-2">
                  <Select
                    value={editOrder.supplierId}
                    onValueChange={(value) => {
                      const supplier = suppliers.find((s) => s.id === value);
                      setEditOrder((prev) => ({
                        ...prev,
                        supplierId: value,
                        supplierName: supplier?.name || '',
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <SelectItem value="no-suppliers" disabled>
                          No suppliers available
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      router.push('/hrm/suppliers/new');
                    }}
                    className="whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editOrder.notes}
                  onChange={(e) =>
                    setEditOrder((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Enter order notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Purchase Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
