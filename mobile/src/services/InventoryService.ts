import { apiService } from './ApiService';
import {
  Warehouse,
  WarehouseCreate,
  WarehouseUpdate,
  WarehousesResponse,
  WarehouseResponse,
  StorageLocation,
  StorageLocationCreate,
  StorageLocationUpdate,
  StorageLocationsResponse,
  StorageLocationResponse,
  StockMovement,
  StockMovementCreate,
  StockMovementUpdate,
  StockMovementsResponse,
  StockMovementResponse,
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrdersResponse,
  PurchaseOrderResponse,
  Receiving,
  ReceivingCreate,
  ReceivingUpdate,
  ReceivingsResponse,
  ReceivingResponse,
  InventoryDashboardStats,
} from '../models/inventory';

class InventoryService {
  private baseUrl = '/inventory';

  async getWarehouses(
    skip: number = 0,
    limit: number = 100,
  ): Promise<WarehousesResponse> {
    const response = await apiService.get(
      `${this.baseUrl}/warehouses?skip=${skip}&limit=${limit}`,
    );
    return response;
  }

  async getWarehouse(id: string): Promise<WarehouseResponse> {
    const response = await apiService.get(`${this.baseUrl}/warehouses/${id}`);
    return response;
  }

  async createWarehouse(
    warehouse: WarehouseCreate,
  ): Promise<WarehouseResponse> {
    const response = await apiService.post(
      `${this.baseUrl}/warehouses`,
      warehouse,
    );
    return response;
  }

  async updateWarehouse(
    id: string,
    warehouse: WarehouseUpdate,
  ): Promise<WarehouseResponse> {
    const response = await apiService.put(
      `${this.baseUrl}/warehouses/${id}`,
      warehouse,
    );
    return response;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/warehouses/${id}`);
  }

  async getStorageLocations(
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StorageLocationsResponse> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouse_id', warehouseId);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/storage-locations?${params.toString()}`,
    );
    return response;
  }

  async getStorageLocation(id: string): Promise<StorageLocationResponse> {
    const response = await apiService.get(
      `${this.baseUrl}/storage-locations/${id}`,
    );
    return response;
  }

  async createStorageLocation(
    location: StorageLocationCreate,
  ): Promise<StorageLocationResponse> {
    const response = await apiService.post(
      `${this.baseUrl}/storage-locations`,
      location,
    );
    return response;
  }

  async updateStorageLocation(
    id: string,
    location: StorageLocationUpdate,
  ): Promise<StorageLocationResponse> {
    const response = await apiService.put(
      `${this.baseUrl}/storage-locations/${id}`,
      location,
    );
    return response;
  }

  async deleteStorageLocation(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/storage-locations/${id}`);
  }

  async getStockMovements(
    productId?: string,
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StockMovementsResponse> {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId);
    if (warehouseId) params.append('warehouse_id', warehouseId);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/stock-movements?${params.toString()}`,
    );
    return response;
  }

  async getStockMovement(id: string): Promise<StockMovementResponse> {
    const response = await apiService.get(
      `${this.baseUrl}/stock-movements/${id}`,
    );
    return response;
  }

  async createStockMovement(
    movement: StockMovementCreate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.post(
      `${this.baseUrl}/stock-movements`,
      movement,
    );
    return response;
  }

  async updateStockMovement(
    id: string,
    movement: StockMovementUpdate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.put(
      `${this.baseUrl}/stock-movements/${id}`,
      movement,
    );
    return response;
  }

  async deleteStockMovement(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/stock-movements/${id}`);
  }

  async getPurchaseOrders(
    status?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<PurchaseOrdersResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/purchase-orders?${params.toString()}`,
    );
    return response;
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
    const response = await apiService.get(
      `${this.baseUrl}/purchase-orders/${id}`,
    );
    return response;
  }

  async createPurchaseOrder(
    order: PurchaseOrderCreate,
  ): Promise<PurchaseOrderResponse> {
    const response = await apiService.post(
      `${this.baseUrl}/purchase-orders`,
      order,
    );
    return response;
  }

  async updatePurchaseOrder(
    id: string,
    order: PurchaseOrderUpdate,
  ): Promise<PurchaseOrderResponse> {
    const response = await apiService.put(
      `${this.baseUrl}/purchase-orders/${id}`,
      order,
    );
    return response;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/purchase-orders/${id}`);
  }

  async getReceivings(
    status?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<ReceivingsResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/receivings?${params.toString()}`,
    );
    return response;
  }

  async getReceiving(id: string): Promise<ReceivingResponse> {
    const response = await apiService.get(`${this.baseUrl}/receivings/${id}`);
    return response;
  }

  async createReceiving(
    receiving: ReceivingCreate,
  ): Promise<ReceivingResponse> {
    const response = await apiService.post(
      `${this.baseUrl}/receivings`,
      receiving,
    );
    return response;
  }

  async updateReceiving(
    id: string,
    receiving: ReceivingUpdate,
  ): Promise<ReceivingResponse> {
    const response = await apiService.put(
      `${this.baseUrl}/receivings/${id}`,
      receiving,
    );
    return response;
  }

  async deleteReceiving(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/receivings/${id}`);
  }

  async getInventoryDashboard(): Promise<InventoryDashboardStats> {
    const response = await apiService.get(`${this.baseUrl}/dashboard`);
    return response;
  }
}

export default new InventoryService();
