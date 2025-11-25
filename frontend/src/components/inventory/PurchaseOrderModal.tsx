'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  PurchaseOrderItemCreate,
} from '../../models/inventory';
import { Supplier } from '../../models/hrm';
import { Product } from '../../models/pos';
import { useCurrency } from '../../contexts/CurrencyContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { apiService } from '../../services/ApiService';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newOrder, setNewOrder] = useState<PurchaseOrderCreate>({
    orderNumber: '',
    batchNumber: '',
    supplierId: '',
    supplierName: '',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    vehicleReg: '',
    vatRate: 0,
    notes: '',
    items: [],
    ...initialData,
  });
  const [newItem, setNewItem] = useState<PurchaseOrderItemCreate>({
    productId: '',
    productName: '',
    sku: '',
    quantity: 0,
    unitCost: 0,
    totalCost: 0,
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const calculateTotals = () => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const vatAmount = subtotal * ((newOrder.vatRate || 0) / 100);
    const total = subtotal + vatAmount;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  const handleVatRateChange = (value: string) => {
    const vatRate = parseFloat(value) || 0;
    setNewOrder(prev => ({ ...prev, vatRate }));
  };

  const fetchData = async () => {
    try {
      const [suppliersResponse, warehousesResponse, productsResponse] = await Promise.all([
        HRMService.getSuppliers(),
        inventoryService.getWarehouses(),
        apiService.get('/pos/products'),
      ]);
      setSuppliers(suppliersResponse.suppliers);
      setWarehouses(warehousesResponse.warehouses);
      setProducts(productsResponse.products || []);

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

  const handleAddItem = () => {
    if (
      !newItem.productId ||
      newItem.quantity <= 0 ||
      newItem.unitCost <= 0
    ) {
      const message = 'Please select a product and fill in quantity and unit cost';
      if (useToastNotifications) {
        toast.error(message);
      } else {
        setErrorMessage(message);
      }
      return;
    }

    const itemWithTotal = {
      ...newItem,
      totalCost: newItem.quantity * newItem.unitCost,
    };

    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, itemWithTotal],
    }));

    setNewItem({
      productId: '',
      productName: '',
      sku: '',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      notes: '',
    });
  };

  const removeItem = (index: number) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreateOrder = async () => {
    const requiredFields = [
      !newOrder.supplierId,
      !newOrder.warehouseId,
      !newOrder.expectedDeliveryDate,
      newOrder.items.length === 0,
    ];

    if (showOrderDate) {
      requiredFields.push(!newOrder.orderDate);
    }

    if (requiredFields.some(Boolean)) {
      const message = 'Please fill in all required fields and add at least one item';
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
      await inventoryService.createPurchaseOrder(newOrder);
      
      if (useToastNotifications) {
        toast.success('Purchase order created successfully');
      }
      
      onClose();
      resetForm();
      onSuccess?.();
    } catch (error) {
      const message = 'Failed to create purchase order. Please try again.';
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
    setNewOrder({
      orderNumber: '',
      batchNumber: '',
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      supplierName: suppliers.length > 0 ? suppliers[0].name : '',
      warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      vehicleReg: initialData?.vehicleReg || '',
      vatRate: 0,
      notes: '',
      items: [],
      ...initialData,
    });
    setNewItem({
      productId: '',
      productName: '',
      sku: '',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      notes: '',
    });
    setErrorMessage('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
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
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={newOrder.batchNumber}
                onChange={(e) =>
                  setNewOrder((prev) => ({
                    ...prev,
                    batchNumber: e.target.value,
                  }))
                }
                placeholder="Enter batch number"
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
                  onClick={() => {
                    onClose();
                    router.push('/hrm/suppliers/new');
                  }}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouseId">Warehouse *</Label>
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
              placeholder="Enter vehicle registration or driver info"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatRate">VAT Rate (%)</Label>
            <Input
              id="vatRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={newOrder.vatRate}
              onChange={(e) => handleVatRateChange(e.target.value)}
              placeholder="0.00"
            />
          </div>

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

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Order Items</Label>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Add Item Form */}
            <div className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select
                  value={newItem.productId}
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    setNewItem((prev) => ({
                      ...prev,
                      productId: value,
                      productName: product?.name || '',
                      sku: product?.sku || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <SelectItem value="no-products" disabled>
                        No products available
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={newItem.sku}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      sku: e.target.value,
                    }))
                  }
                  placeholder="SKU"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Qty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost *</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unitCost}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      unitCost: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Cost"
                />
              </div>
            </div>

            {/* Items List */}
            {newOrder.items.length > 0 && (
              <div className="space-y-2">
                <Label>Added Items</Label>
                <div className="space-y-2">
                  {newOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unitCost)} ={' '}
                          {formatCurrency(item.totalCost)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm">
                    Subtotal: {formatCurrency(calculateTotals().subtotal)}
                  </div>
                  {(newOrder.vatRate || 0) > 0 && (
                    <div className="text-sm">
                      VAT ({newOrder.vatRate}%): {formatCurrency(calculateTotals().vatAmount)}
                    </div>
                  )}
                  <div className="font-medium text-lg">
                    Total: {formatCurrency(calculateTotals().total)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={isSubmitting || newOrder.items.length === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
