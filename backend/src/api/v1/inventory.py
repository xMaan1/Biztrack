from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..dependencies import get_current_user, get_current_tenant
from ...config.database import get_db
from ...models.unified_models import (
    User, Tenant,
    Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehousesResponse,
    StorageLocation, StorageLocationCreate, StorageLocationUpdate, StorageLocationResponse, StorageLocationsResponse,
    StockMovement, StockMovementCreate, StockMovementUpdate, StockMovementResponse, StockMovementsResponse,
    Supplier, SupplierCreate, SupplierUpdate, SupplierResponse, SuppliersResponse,
    PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse, PurchaseOrdersResponse,
    Receiving, ReceivingCreate, ReceivingUpdate, ReceivingResponse, ReceivingsResponse,
    InventoryDashboardStats, StockAlert
)
from ...config.database import (
    get_warehouses, get_warehouse_by_id, create_warehouse, update_warehouse, delete_warehouse,
    get_storage_locations, get_storage_location_by_id, create_storage_location, update_storage_location, delete_storage_location,
    get_stock_movements, get_stock_movement_by_id, create_stock_movement, update_stock_movement,
    get_suppliers, get_supplier_by_id, get_supplier_by_code, create_supplier, update_supplier, delete_supplier,
    get_purchase_orders, get_purchase_orders_by_status, get_purchase_order_by_id, create_purchase_order, update_purchase_order, delete_purchase_order,
    get_receivings, get_receiving_by_id, create_receiving, update_receiving, delete_receiving,
    get_inventory_dashboard_stats
)

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

# Warehouse Endpoints
@router.get("/warehouses", response_model=WarehousesResponse)
def read_warehouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all warehouses for the current tenant"""
    warehouses = get_warehouses(db, str(current_tenant["id"]), skip, limit)
    total = len(warehouses)  # Simplified - you can add proper count query
    
    # Convert SQLAlchemy models to Pydantic models
    warehouse_list = []
    for warehouse in warehouses:
        warehouse_dict = {
            "id": str(warehouse.id),
            "tenantId": str(warehouse.tenant_id),
            "createdBy": warehouse.createdBy,
            "name": warehouse.name,
            "code": warehouse.code,
            "description": warehouse.description,
            "address": warehouse.address,
            "city": warehouse.city,
            "state": warehouse.state,
            "country": warehouse.country,
            "postalCode": warehouse.postalCode,
            "phone": warehouse.phone,
            "email": warehouse.email,
            "managerId": warehouse.managerId,
            "isActive": warehouse.isActive,
            "capacity": warehouse.capacity,
            "usedCapacity": warehouse.usedCapacity,
            "temperatureZone": warehouse.temperatureZone,
            "securityLevel": warehouse.securityLevel,
            "createdAt": warehouse.createdAt,
            "updatedAt": warehouse.updatedAt,
        }
        warehouse_list.append(warehouse_dict)
    
    return WarehousesResponse(warehouses=warehouse_list, total=total)

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def read_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific warehouse by ID"""
    warehouse = get_warehouse_by_id(warehouse_id, db, str(current_tenant["id"]))
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Convert SQLAlchemy model to Pydantic model
    warehouse_dict = {
        "id": str(warehouse.id),
        "tenantId": str(warehouse.tenant_id),
        "createdBy": warehouse.createdBy,
        "name": warehouse.name,
        "code": warehouse.code,
        "description": warehouse.description,
        "address": warehouse.address,
        "city": warehouse.city,
        "state": warehouse.state,
        "country": warehouse.country,
        "postalCode": warehouse.postalCode,
        "phone": warehouse.phone,
        "email": warehouse.email,
        "managerId": warehouse.managerId,
        "isActive": warehouse.isActive,
        "capacity": warehouse.capacity,
        "usedCapacity": warehouse.usedCapacity,
        "temperatureZone": warehouse.temperatureZone,
        "securityLevel": warehouse.securityLevel,
        "createdAt": warehouse.createdAt,
        "updatedAt": warehouse.updatedAt,
    }
    
    return WarehouseResponse(warehouse=warehouse_dict)

@router.post("/warehouses", response_model=WarehouseResponse)
def create_warehouse_endpoint(
    warehouse: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new warehouse"""
    try:
        warehouse_data = warehouse.dict()
        warehouse_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(current_tenant["id"]),
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })
        
        db_warehouse = create_warehouse(warehouse_data, db)
        
        # Convert SQLAlchemy model to Pydantic model
        warehouse_dict = {
            "id": str(db_warehouse.id),
            "tenantId": str(db_warehouse.tenant_id),
            "createdBy": db_warehouse.createdBy,
            "name": db_warehouse.name,
            "code": db_warehouse.code,
            "description": db_warehouse.description,
            "address": db_warehouse.address,
            "city": db_warehouse.city,
            "state": db_warehouse.state,
            "country": db_warehouse.country,
            "postalCode": db_warehouse.postalCode,
            "phone": db_warehouse.phone,
            "email": db_warehouse.email,
            "managerId": db_warehouse.managerId,
            "isActive": db_warehouse.isActive,
            "capacity": db_warehouse.capacity,
            "usedCapacity": db_warehouse.usedCapacity,
            "temperatureZone": db_warehouse.temperatureZone,
            "securityLevel": db_warehouse.securityLevel,
            "createdAt": db_warehouse.createdAt,
            "updatedAt": db_warehouse.updatedAt,
        }
        
        return WarehouseResponse(warehouse=warehouse_dict)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create warehouse: {str(e)}"
        )

@router.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse_endpoint(
    warehouse_id: str,
    warehouse: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing warehouse"""
    warehouse_update = warehouse.dict(exclude_unset=True)
    warehouse_update["updatedAt"] = datetime.utcnow()
    
    db_warehouse = update_warehouse(warehouse_id, warehouse_update, db, str(current_tenant["id"]))
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Convert SQLAlchemy model to Pydantic model
    warehouse_dict = {
        "id": str(db_warehouse.id),
        "tenantId": str(db_warehouse.tenant_id),
        "createdBy": db_warehouse.createdBy,
        "name": db_warehouse.name,
        "code": db_warehouse.code,
        "description": db_warehouse.description,
        "address": db_warehouse.address,
        "city": db_warehouse.city,
        "state": db_warehouse.state,
        "country": db_warehouse.country,
        "postalCode": db_warehouse.postalCode,
        "phone": db_warehouse.phone,
        "email": db_warehouse.email,
        "managerId": db_warehouse.managerId,
        "isActive": db_warehouse.isActive,
        "capacity": db_warehouse.capacity,
        "usedCapacity": db_warehouse.usedCapacity,
        "temperatureZone": db_warehouse.temperatureZone,
        "securityLevel": db_warehouse.securityLevel,
        "createdAt": db_warehouse.createdAt,
        "updatedAt": db_warehouse.updatedAt,
    }
    
    return WarehouseResponse(warehouse=warehouse_dict)

@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse_endpoint(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Delete a warehouse"""
    success = delete_warehouse(warehouse_id, db, str(current_tenant["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"message": "Warehouse deleted successfully"}

# Storage Location Endpoints
@router.get("/storage-locations", response_model=StorageLocationsResponse)
def read_storage_locations(
    warehouse_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all storage locations for the current tenant"""
    locations = get_storage_locations(db, str(current_tenant["id"]), warehouse_id, skip, limit)
    total = len(locations)
    return StorageLocationsResponse(storageLocations=locations, total=total)

@router.get("/storage-locations/{location_id}", response_model=StorageLocationResponse)
def read_storage_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific storage location by ID"""
    location = get_storage_location_by_id(db, location_id, str(current_tenant["id"]))
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")
    return StorageLocationResponse(storageLocation=location)

@router.post("/storage-locations", response_model=StorageLocationResponse)
def create_storage_location_endpoint(
    location: StorageLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new storage location"""
    location_data = location.dict()
    location_data.update({
        "id": str(uuid.uuid4()),
        "tenantId": str(current_tenant["id"]),
        "createdBy": str(current_user.id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_location = create_storage_location(location_data, db)
    return StorageLocationResponse(storageLocation=db_location)

@router.put("/storage-locations/{location_id}", response_model=StorageLocationResponse)
def update_storage_location_endpoint(
    location_id: str,
    location: StorageLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing storage location"""
    location_update = location.dict(exclude_unset=True)
    location_update["updatedAt"] = datetime.utcnow()
    
    db_location = update_storage_location(db, location_id, location_update, str(current_tenant["id"]))
    if not db_location:
        raise HTTPException(status_code=404, detail="Storage location not found")
    
    return StorageLocationResponse(storageLocation=db_location)

@router.delete("/storage-locations/{location_id}")
def delete_storage_location_endpoint(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Delete a storage location"""
    success = delete_storage_location(db, location_id, str(current_tenant["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Storage location not found")
    return {"message": "Storage location deleted successfully"}

# Stock Movement Endpoints
@router.get("/stock-movements", response_model=StockMovementsResponse)
def read_stock_movements(
    product_id: Optional[str] = Query(None),
    warehouse_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all stock movements for the current tenant"""
    movements = get_stock_movements(db, str(current_tenant["id"]), product_id, warehouse_id, skip, limit)
    total = len(movements)
    return StockMovementsResponse(stockMovements=movements, total=total)

@router.get("/stock-movements/{movement_id}", response_model=StockMovementResponse)
def read_stock_movement(
    movement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific stock movement by ID"""
    movement = get_stock_movement_by_id(db, movement_id, str(current_tenant["id"]))
    if not movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    return StockMovementResponse(stockMovement=movement)

@router.post("/stock-movements", response_model=StockMovementResponse)
def create_stock_movement_endpoint(
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new stock movement"""
    movement_data = movement.dict()
    movement_data.update({
        "id": str(uuid.uuid4()),
        "tenantId": str(current_tenant["id"]),
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_movement = create_stock_movement(movement_data, db)
    return StockMovementResponse(stockMovement=db_movement)

@router.put("/stock-movements/{movement_id}", response_model=StockMovementResponse)
def update_stock_movement_endpoint(
    movement_id: str,
    movement: StockMovementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing stock movement"""
    movement_update = movement.dict(exclude_unset=True)
    movement_update["updatedAt"] = datetime.utcnow()
    
    db_movement = update_stock_movement(db, movement_id, movement_update, str(current_tenant["id"]))
    if not db_movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    
    return StockMovementResponse(stockMovement=db_movement)

# Supplier Endpoints
@router.get("/suppliers", response_model=SuppliersResponse)
def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all suppliers for the current tenant"""
    suppliers = get_suppliers(db, str(current_tenant["id"]), skip, limit)
    total = len(suppliers)
    return SuppliersResponse(suppliers=suppliers, total=total)

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def read_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific supplier by ID"""
    supplier = get_supplier_by_id(db, supplier_id, str(current_tenant["id"]))
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return SupplierResponse(supplier=supplier)

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier_endpoint(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new supplier"""
    # Check if supplier code already exists for this tenant
    existing_supplier = get_supplier_by_code(supplier.code, db, str(current_tenant["id"]))
    if existing_supplier:
        raise HTTPException(
            status_code=400, 
            detail=f"Supplier with code '{supplier.code}' already exists"
        )
    
    supplier_data = supplier.dict()
    supplier_data.update({
        "id": str(uuid.uuid4()),
        "tenantId": str(current_tenant["id"]),
        "createdBy": str(current_user.id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_supplier = create_supplier(supplier_data, db)
    return SupplierResponse(supplier=db_supplier)

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier_endpoint(
    supplier_id: str,
    supplier: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing supplier"""
    supplier_update = supplier.dict(exclude_unset=True)
    supplier_update["updatedAt"] = datetime.utcnow()
    
    db_supplier = update_supplier(supplier_id, supplier_update, db, str(current_tenant["id"]))
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return SupplierResponse(supplier=db_supplier)

@router.delete("/suppliers/{supplier_id}")
def delete_supplier_endpoint(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Delete a supplier"""
    success = delete_supplier(supplier_id, db, str(current_tenant["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

# Purchase Order Endpoints
@router.get("/purchase-orders", response_model=PurchaseOrdersResponse)
def read_purchase_orders(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all purchase orders for the current tenant"""
    if status:
        orders = get_purchase_orders_by_status(status, db, str(current_tenant["id"]), skip, limit)
    else:
        orders = get_purchase_orders(db, str(current_tenant["id"]), skip, limit)
    
    total = len(orders)
    
    # Convert to response format
    response_orders = []
    for order in orders:
        response_data = {
            "id": str(order.id),
            "tenantId": str(order.tenant_id),
            "orderNumber": order.poNumber,
            "supplierId": str(order.supplierId),
            "supplierName": "",  # Not stored in DB, will be empty
            "warehouseId": str(order.warehouseId),
            "orderDate": order.orderDate.isoformat() if order.orderDate else None,
            "expectedDeliveryDate": order.expectedDeliveryDate.isoformat() if order.expectedDeliveryDate else None,
            "status": order.status,
            "totalAmount": order.totalAmount,
            "notes": order.notes,
            "items": [],  # Not stored in DB, will be empty
            "createdBy": str(order.createdBy) if hasattr(order, 'createdBy') else "",
            "createdAt": order.createdAt,
            "updatedAt": order.updatedAt
        }
        response_orders.append(response_data)
    
    return PurchaseOrdersResponse(purchaseOrders=response_orders, total=total)

@router.get("/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def read_purchase_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific purchase order by ID"""
    order = get_purchase_order_by_id(order_id, db, str(current_tenant["id"]))
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Convert to response format
    response_data = {
        "id": str(order.id),
        "tenantId": str(order.tenant_id),
        "orderNumber": order.poNumber,
        "supplierId": str(order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(order.warehouseId),
        "orderDate": order.orderDate.isoformat() if order.orderDate else None,
        "expectedDeliveryDate": order.expectedDeliveryDate.isoformat() if order.expectedDeliveryDate else None,
        "status": order.status,
        "totalAmount": order.totalAmount,
        "notes": order.notes,
        "items": [],  # Not stored in DB, will be empty
        "createdBy": str(order.createdBy) if hasattr(order, 'createdBy') else "",
        "createdAt": order.createdAt,
        "updatedAt": order.updatedAt
    }
    
    return PurchaseOrderResponse(purchaseOrder=response_data)

@router.post("/purchase-orders", response_model=PurchaseOrderResponse)
def create_purchase_order_endpoint(
    order: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new purchase order"""
    # Calculate total amount from items
    total_amount = sum(item.totalCost for item in order.items)
    
    order_data = order.dict()
    order_data["poNumber"] = order_data.pop("orderNumber")
    # Remove fields that don't exist in SQLAlchemy model
    order_data.pop("supplierName", None)
    order_data.pop("items", None)
    
    # Convert date strings to date objects
    if order_data.get("orderDate"):
        order_data["orderDate"] = datetime.strptime(order_data["orderDate"], "%Y-%m-%d").date()
    if order_data.get("expectedDeliveryDate"):
        order_data["expectedDeliveryDate"] = datetime.strptime(order_data["expectedDeliveryDate"], "%Y-%m-%d").date()
    
    order_data.update({
        "id": str(uuid.uuid4()),
        "tenant_id": str(current_tenant["id"]),
        "createdBy": str(current_user.id),
        "status": "draft",
        "totalAmount": total_amount,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_order = create_purchase_order(order_data, db)
    
    # Convert to response format
    response_data = {
        "id": str(db_order.id),
        "tenantId": str(db_order.tenant_id),
        "orderNumber": db_order.poNumber,
        "supplierId": str(db_order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(db_order.warehouseId),
        "orderDate": db_order.orderDate.isoformat() if db_order.orderDate else None,
        "expectedDeliveryDate": db_order.expectedDeliveryDate.isoformat() if db_order.expectedDeliveryDate else None,
        "status": db_order.status,
        "totalAmount": db_order.totalAmount,
        "notes": db_order.notes,
        "items": [],  # Not stored in DB, will be empty
        "createdBy": str(db_order.createdBy),
        "createdAt": db_order.createdAt,
        "updatedAt": db_order.updatedAt
    }
    
    return PurchaseOrderResponse(purchaseOrder=response_data)

@router.put("/purchase-orders/{order_id}", response_model=PurchaseOrderResponse)
def update_purchase_order_endpoint(
    order_id: str,
    order: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing purchase order"""
    order_update = order.dict(exclude_unset=True)
    if "orderNumber" in order_update:
        order_update["poNumber"] = order_update.pop("orderNumber")
    
    # Remove fields that don't exist in SQLAlchemy model
    order_update.pop("supplierName", None)
    
    # Convert date strings to date objects
    if order_update.get("orderDate"):
        order_update["orderDate"] = datetime.strptime(order_update["orderDate"], "%Y-%m-%d").date()
    if order_update.get("expectedDeliveryDate"):
        order_update["expectedDeliveryDate"] = datetime.strptime(order_update["expectedDeliveryDate"], "%Y-%m-%d").date()
    
    order_update["updatedAt"] = datetime.utcnow()
    
    db_order = update_purchase_order(order_id, order_update, db, str(current_tenant["id"]))
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Convert to response format
    response_data = {
        "id": str(db_order.id),
        "tenantId": str(db_order.tenant_id),
        "orderNumber": db_order.poNumber,
        "supplierId": str(db_order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(db_order.warehouseId),
        "orderDate": db_order.orderDate.isoformat() if db_order.orderDate else None,
        "expectedDeliveryDate": db_order.expectedDeliveryDate.isoformat() if db_order.expectedDeliveryDate else None,
        "status": db_order.status,
        "totalAmount": db_order.totalAmount,
        "notes": db_order.notes,
        "items": [],  # Not stored in DB, will be empty
        "createdBy": str(db_order.createdBy) if hasattr(db_order, 'createdBy') else "",
        "createdAt": db_order.createdAt,
        "updatedAt": db_order.updatedAt
    }
    
    return PurchaseOrderResponse(purchaseOrder=response_data)

@router.delete("/purchase-orders/{order_id}")
def delete_purchase_order_endpoint(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Delete a purchase order"""
    success = delete_purchase_order(order_id, db, str(current_tenant["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": "Purchase order deleted successfully"}

# Receiving Endpoints
@router.get("/receivings", response_model=ReceivingsResponse)
def read_receivings(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get all receivings for the current tenant"""
    receivings = get_receivings(db, str(current_tenant["id"]), status, skip, limit)
    total = len(receivings)
    return ReceivingsResponse(receivings=receivings, total=total)

@router.get("/receivings/{receiving_id}", response_model=ReceivingResponse)
def read_receiving(
    receiving_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get a specific receiving by ID"""
    receiving = get_receiving_by_id(db, receiving_id, str(current_tenant["id"]))
    if not receiving:
        raise HTTPException(status_code=404, detail="Receiving not found")
    return ReceivingResponse(receiving=receiving)

@router.post("/receivings", response_model=ReceivingResponse)
def create_receiving_endpoint(
    receiving: ReceivingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Create a new receiving"""
    receiving_data = receiving.dict()
    receiving_data.update({
        "id": str(uuid.uuid4()),
        "tenantId": str(current_tenant["id"]),
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_receiving = create_receiving(receiving_data, db)
    return ReceivingResponse(receiving=db_receiving)

@router.put("/receivings/{receiving_id}", response_model=ReceivingResponse)
def update_receiving_endpoint(
    receiving_id: str,
    receiving: ReceivingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Update an existing receiving"""
    receiving_update = receiving.dict(exclude_unset=True)
    receiving_update["updatedAt"] = datetime.utcnow()
    
    db_receiving = update_receiving(db, receiving_id, receiving_update, str(current_tenant["id"]))
    if not db_receiving:
        raise HTTPException(status_code=404, detail="Receiving not found")
    
    return ReceivingResponse(receiving=db_receiving)

@router.delete("/receivings/{receiving_id}")
def delete_receiving_endpoint(
    receiving_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Delete a receiving"""
    success = delete_receiving(db, receiving_id, str(current_tenant["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Receiving not found")
    return {"message": "Receiving deleted successfully"}

# Dashboard Endpoints
@router.get("/dashboard", response_model=InventoryDashboardStats)
def get_inventory_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_tenant: dict = Depends(get_current_tenant)
):
    """Get inventory dashboard statistics"""
    return get_inventory_dashboard_stats(db, str(current_tenant["id"]))
