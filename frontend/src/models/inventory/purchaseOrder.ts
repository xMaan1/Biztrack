export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemCreate {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface PurchaseOrderItemUpdate {
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  createdBy: string;
  orderNumber: string;
  batchNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  vehicleReg?: string;
  items: PurchaseOrderItemCreate[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderCreate {
  orderNumber?: string;
  batchNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  vatRate?: number;
  notes?: string;
  vehicleReg?: string;
  items: PurchaseOrderItemCreate[];
}

export interface PurchaseOrderUpdate {
  orderNumber?: string;
  batchNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status?: PurchaseOrderStatus;
  vatRate?: number;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  notes?: string;
  vehicleReg?: string;
}

export interface PurchaseOrderResponse {
  purchaseOrder: PurchaseOrder;
}

export interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
}
