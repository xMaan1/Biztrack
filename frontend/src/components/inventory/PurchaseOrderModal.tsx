'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus } from 'lucide-react';
import { inventoryService } from '../../services/InventoryService';
import HRMService from '../../services/HRMService';
import {
  PurchaseOrderCreate,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../../models/inventory';
import { Supplier } from '../../models/hrm';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { VehicleSearch } from '../ui/vehicle-search';
import { Vehicle } from '../../models/workshop';
import { usePlanInfo } from '../../hooks/usePlanInfo';
import { getApiErrorMessage } from '../../lib/apiError';
import { WorkshopDocumentLinks, WorkshopDocumentLinksValue } from '../workshop/WorkshopDocumentLinks';
import { SupplierFormDialog } from '../hrm/suppliers/SupplierFormDialog';
import {
  emptySupplierForm,
  validateSupplierForm,
} from '../hrm/suppliers/supplierUtils';
import type { SupplierFormData } from '../hrm/suppliers/types';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (order?: PurchaseOrder) => void;
  title?: string;
  showOrderDate?: boolean;
  showSupplierCount?: boolean;
  showAddSupplierButton?: boolean;
  useToastNotifications?: boolean;
  initialData?: Partial<PurchaseOrderCreate>;
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Create Purchase Order',
  showOrderDate = true,
  showSupplierCount = false,
  showAddSupplierButton = false,
  useToastNotifications = true,
  initialData = {},
}: PurchaseOrderModalProps) {
  const { planInfo } = usePlanInfo();
  const isHealthcare = planInfo?.planType === 'healthcare';
  const isWorkshop = planInfo?.planType === 'workshop';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>(
    emptySupplierForm(),
  );
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [documentLinks, setDocumentLinks] = useState<WorkshopDocumentLinksValue>({});
  const [newOrder, setNewOrder] = useState<PurchaseOrderCreate>({
    orderNumber: '',
    batchNumber: '',
    supplierId: '',
    supplierName: '',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: PurchaseOrderStatus.DRAFT,
    vehicleReg: '',
    purchaseForType: undefined,
    vehicleId: undefined,
    jobCardId: undefined,
    department: '',
    deliveryLocation: '',
    requisitionNumber: '',
    notes: '',
    ...initialData,
  });

  const orderStatus = newOrder.status ?? PurchaseOrderStatus.DRAFT;
  const requiresDelivery =
    orderStatus !== PurchaseOrderStatus.ARRIVED &&
    orderStatus !== PurchaseOrderStatus.CANCELLED;

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setDocumentLinks({
        jobCardId: initialData.jobCardId || undefined,
      });
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [suppliersResponse, warehousesResponse] = await Promise.all([
        HRMService.getSuppliers(),
        inventoryService.getWarehouses(),
      ]);
      setSuppliers(suppliersResponse.suppliers);
      setWarehouses(warehousesResponse.warehouses);

      if (suppliersResponse.suppliers.length > 0 && !newOrder.supplierId) {
        setNewOrder((prev) => ({
          ...prev,
          supplierId: suppliersResponse.suppliers[0].id,
          supplierName: suppliersResponse.suppliers[0].name,
        }));
      }

      if (warehousesResponse.warehouses.length > 0 && !newOrder.warehouseId) {
        setNewOrder((prev) => ({
          ...prev,
          warehouseId: warehousesResponse.warehouses[0].id,
        }));
      }
    } catch (error) {
    }
  };

  const handleCreateOrder = async () => {
    const requiredFields = [
      !newOrder.supplierId,
      !newOrder.warehouseId,
      ...(requiresDelivery ? [!newOrder.expectedDeliveryDate] : []),
    ];

    if (showOrderDate) {
      requiredFields.push(!newOrder.orderDate);
    }

    if (requiredFields.some(Boolean)) {
      const message = 'Please fill in all required fields';
      if (useToastNotifications) {
        toast.error(message);
      } else {
        setErrorMessage(message);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const payload: PurchaseOrderCreate = isHealthcare
        ? {
            ...newOrder,
            vehicleReg: undefined,
            purchaseForType: undefined,
            vehicleId: undefined,
            jobCardId: undefined,
          }
        : {
            ...newOrder,
            department: undefined,
            deliveryLocation: undefined,
            requisitionNumber: undefined,
            jobCardId: documentLinks.jobCardId,
            vehicleId: newOrder.purchaseForType === 'vehicle' ? newOrder.vehicleId : undefined,
            purchaseForType: newOrder.purchaseForType,
          };
      payload.expectedDeliveryDate = requiresDelivery
        ? newOrder.expectedDeliveryDate
        : undefined;
      const created = await inventoryService.createPurchaseOrder(payload);
      
      if (useToastNotifications) {
        toast.success('Purchase order created successfully');
      }
      
      onClose();
      resetForm();
      onSuccess?.(created.purchaseOrder);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to create purchase order. Please try again.');
      if (useToastNotifications) {
        toast.error(message);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedVehicle(null);
    setDocumentLinks({});
    setNewOrder({
      orderNumber: '',
      batchNumber: '',
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      supplierName: suppliers.length > 0 ? suppliers[0].name : '',
      warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      status: PurchaseOrderStatus.DRAFT,
      vehicleReg: initialData?.vehicleReg || '',
      purchaseForType: initialData?.purchaseForType,
      vehicleId: initialData?.vehicleId,
      jobCardId: initialData?.jobCardId,
      department: initialData?.department || '',
      deliveryLocation: initialData?.deliveryLocation || '',
      requisitionNumber: initialData?.requisitionNumber || '',
      notes: '',
      ...initialData,
    });
    setErrorMessage('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const openAddSupplier = () => {
    setSupplierFormData(emptySupplierForm());
    setIsAddSupplierOpen(true);
  };

  const handleSupplierFormChange = (
    field: keyof SupplierFormData,
    value: string | number | boolean | undefined,
  ) => {
    setSupplierFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSupplier = async () => {
    const validationError = validateSupplierForm(supplierFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsSavingSupplier(true);
    try {
      const response = await HRMService.createSupplier(supplierFormData);
      toast.success('Supplier created successfully');
      setIsAddSupplierOpen(false);
      setSupplierFormData(emptySupplierForm());
      const suppliersResponse = await HRMService.getSuppliers();
      setSuppliers(suppliersResponse.suppliers);
      setNewOrder((prev) => ({
        ...prev,
        supplierId: response.supplier.id,
        supplierName: response.supplier.name,
      }));
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to create supplier');
      toast.error(message);
    } finally {
      setIsSavingSupplier(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={newOrder.orderNumber}
                disabled
                className="bg-muted"
                placeholder="Auto-generated"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">
                {isHealthcare ? 'Lot / batch reference' : 'Batch Number'}
              </Label>
              <Input
                id="batchNumber"
                value={newOrder.batchNumber}
                onChange={(e) =>
                  setNewOrder((prev) => ({
                    ...prev,
                    batchNumber: e.target.value,
                  }))
                }
                placeholder={
                  isHealthcare ? 'e.g. cold chain lot, supplier batch' : 'Enter batch number'
                }
              />
            </div>
            {showOrderDate && (
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={newOrder.orderDate}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      orderDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            {requiresDelivery && (
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery *</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="date"
                  value={newOrder.expectedDeliveryDate}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      expectedDeliveryDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newOrder.status ?? PurchaseOrderStatus.DRAFT}
                onValueChange={(value) =>
                  setNewOrder((prev) => {
                    const nextStatus = value as PurchaseOrderStatus;
                    const nextRequiresDelivery =
                      nextStatus !== PurchaseOrderStatus.ARRIVED &&
                      nextStatus !== PurchaseOrderStatus.CANCELLED;
                    return {
                      ...prev,
                      status: nextStatus,
                      expectedDeliveryDate: nextRequiresDelivery
                        ? prev.expectedDeliveryDate
                        : '',
                    };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PurchaseOrderStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={PurchaseOrderStatus.ORDERED}>Ordered</SelectItem>
                  <SelectItem value={PurchaseOrderStatus.ARRIVED}>Arrived</SelectItem>
                  <SelectItem value={PurchaseOrderStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierId">
              Supplier *{showSupplierCount && ` (${suppliers.length} available)`}
            </Label>
            <div className="flex gap-2">
              <Select
                value={newOrder.supplierId}
                onValueChange={(value) => {
                  const supplier = suppliers.find((s) => s.id === value);
                  setNewOrder((prev) => ({
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
              {showAddSupplierButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openAddSupplier}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouseId">{isWorkshop ? 'Garage / Warehouse *' : 'Warehouse *'}</Label>
            <Select
              value={newOrder.warehouseId}
              onValueChange={(value) => {
                setNewOrder((prev) => ({
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

          {isHealthcare ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newOrder.department ?? ''}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  placeholder="e.g. Pharmacy, ICU, General ward"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryLocation">Delivery location</Label>
                <Input
                  id="deliveryLocation"
                  value={newOrder.deliveryLocation ?? ''}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      deliveryLocation: e.target.value,
                    }))
                  }
                  placeholder="e.g. Main store, Ward 3, Central pharmacy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requisitionNumber">Internal requisition #</Label>
                <Input
                  id="requisitionNumber"
                  value={newOrder.requisitionNumber ?? ''}
                  onChange={(e) =>
                    setNewOrder((prev) => ({
                      ...prev,
                      requisitionNumber: e.target.value,
                    }))
                  }
                  placeholder="Optional reference from your approval workflow"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Purchase for</Label>
                <Select
                  value={newOrder.purchaseForType || 'none'}
                  onValueChange={(v) => {
                    const purchaseForType = v === 'none' ? undefined : (v as 'vehicle' | 'garage');
                    setNewOrder((prev) => ({
                      ...prev,
                      purchaseForType,
                      vehicleId: purchaseForType === 'vehicle' ? prev.vehicleId : undefined,
                      vehicleReg: purchaseForType === 'vehicle' ? prev.vehicleReg : '',
                    }));
                    if (v !== 'vehicle') {
                      setSelectedVehicle(null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="vehicle">Existing vehicle</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newOrder.purchaseForType === 'vehicle' && (
                <>
                  <div className="space-y-2">
                    <VehicleSearch
                      label="Vehicle"
                      value={selectedVehicle}
                      onSelect={(v) => {
                        setSelectedVehicle(v);
                        if (v) {
                          setNewOrder((prev) => ({
                            ...prev,
                            vehicleId: v.id,
                            vehicleReg: v.registration_number ?? '',
                          }));
                        }
                      }}
                      placeholder="Search by reg, VIN, make, model..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleReg">Vehicle Registration</Label>
                    <Input
                      id="vehicleReg"
                      value={newOrder.vehicleReg}
                      onChange={(e) =>
                        setNewOrder((prev) => ({
                          ...prev,
                          vehicleReg: e.target.value,
                        }))
                      }
                      placeholder="Vehicle registration"
                    />
                  </div>
                </>
              )}
              {newOrder.purchaseForType === 'garage' && (
                <p className="text-sm text-muted-foreground">
                  Parts will be delivered to the selected garage/warehouse above.
                </p>
              )}
            </>
          )}

          {isWorkshop && (
            <WorkshopDocumentLinks
              excludeType="purchase_order"
              value={documentLinks}
              onChange={setDocumentLinks}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newOrder.notes}
              onChange={(e) =>
                setNewOrder((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Enter order notes"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <SupplierFormDialog
        open={isAddSupplierOpen}
        editingSupplier={null}
        formData={supplierFormData}
        submitting={isSavingSupplier}
        onOpenChange={setIsAddSupplierOpen}
        onFormChange={handleSupplierFormChange}
        onSubmit={handleCreateSupplier}
        onCancel={() => setIsAddSupplierOpen(false)}
      />
    </>
  );
}
