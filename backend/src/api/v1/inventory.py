from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Optional
from datetime import datetime
import uuid
import re

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.unified_models import (
    User, Tenant,
    Warehouse, WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehousesResponse,
    StorageLocation, StorageLocationCreate, StorageLocationUpdate, StorageLocationResponse, StorageLocationsResponse,
    StockMovement, StockMovementCreate, StockMovementUpdate, StockMovementResponse, StockMovementsResponse,
    StockMovementWithProduct, StockMovementsWithProductResponse,
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse, PurchaseOrdersResponse,
    Receiving, ReceivingCreate, ReceivingUpdate, ReceivingResponse, ReceivingsResponse,
    InventoryDashboardStats, StockAlert
)
from ...config.inventory_models import PurchaseOrder as PurchaseOrderDB
from ...config.database import (
    get_warehouses, get_warehouse_by_id, create_warehouse, update_warehouse, delete_warehouse,
    get_storage_locations, get_storage_locations_by_warehouse, get_storage_location_by_id, create_storage_location, update_storage_location, delete_storage_location,
    get_stock_movements, get_stock_movement_by_id, create_stock_movement, update_stock_movement, delete_stock_movement,
    get_purchase_orders, get_purchase_orders_by_status, get_purchase_order_by_id, create_purchase_order, update_purchase_order, delete_purchase_order,
    get_receivings, get_receiving_by_id, create_receiving, update_receiving, delete_receiving,
    get_inventory_dashboard_stats
)

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

def generate_purchase_order_number(tenant_id: str, db: Session) -> str:
    """Generate unique purchase order number with proper race condition handling"""
    year = datetime.now().year
    month = datetime.now().month
    
    # Use a retry mechanism to handle race conditions
    max_retries = 10
    for attempt in range(max_retries):
        # Get the highest purchase order number for this month
        highest_po = db.query(PurchaseOrderDB).filter(
            and_(
                PurchaseOrderDB.tenant_id == tenant_id,
                func.extract('year', PurchaseOrderDB.createdAt) == year,
                func.extract('month', PurchaseOrderDB.createdAt) == month
            )
        ).order_by(desc(PurchaseOrderDB.poNumber)).first()
        
        if highest_po:
            # Extract the number from the highest purchase order
            try:
                # Parse the existing purchase order number format: PO-YYYYMM-XXXX
                parts = highest_po.poNumber.split('-')
                if len(parts) == 3:
                    last_number = int(parts[2])
                    new_number = last_number + 1
                else:
                    # Fallback: count all purchase orders for this month
                    count = db.query(PurchaseOrderDB).filter(
                        and_(
                            PurchaseOrderDB.tenant_id == tenant_id,
                            func.extract('year', PurchaseOrderDB.createdAt) == year,
                            func.extract('month', PurchaseOrderDB.createdAt) == month
                        )
                    ).count()
                    new_number = count + 1
            except (ValueError, IndexError):
                # Fallback: count all purchase orders for this month
                count = db.query(PurchaseOrderDB).filter(
                    and_(
                        PurchaseOrderDB.tenant_id == tenant_id,
                        func.extract('year', PurchaseOrderDB.createdAt) == year,
                        func.extract('month', PurchaseOrderDB.createdAt) == month
                    )
                ).count()
                new_number = count + 1
        else:
            # First purchase order for this month
            new_number = 1
        
        # Format the purchase order number: PO-YYYYMM-XXXX
        po_number = f"PO-{year:04d}{month:02d}-{new_number:04d}"
        
        # Check if this number already exists (race condition check)
        existing_po = db.query(PurchaseOrderDB).filter(
            PurchaseOrderDB.poNumber == po_number
        ).first()
        
        if not existing_po:
            return po_number
        
        # If we get here, there was a race condition, retry
        if attempt == max_retries - 1:
            raise HTTPException(
                status_code=500,
                detail="Unable to generate unique purchase order number after multiple attempts"
            )
    
    return po_number



# Warehouse Endpoints
@router.get("/warehouses", response_model=WarehousesResponse)
def read_warehouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all warehouses for the current tenant"""
    warehouses = get_warehouses(db, str(tenant_context["tenant_id"]), skip, limit)
    total = len(warehouses)  # Simplified - you can add proper count query
    
    # Convert SQLAlchemy models to Pydantic models
    warehouse_list = []
    for warehouse in warehouses:
        warehouse_dict = {
            "id": str(warehouse.id),
            "tenant_id": str(warehouse.tenant_id),
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific warehouse by ID"""
    warehouse = get_warehouse_by_id(warehouse_id, db, str(tenant_context["tenant_id"]))
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Convert SQLAlchemy model to Pydantic model
    warehouse_dict = {
        "id": str(warehouse.id),
        "tenant_id": str(warehouse.tenant_id),
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new warehouse"""
    try:
        warehouse_data = warehouse.dict()
        warehouse_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(tenant_context["tenant_id"]),
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })
        
        db_warehouse = create_warehouse(warehouse_data, db)
        
        # Convert SQLAlchemy model to Pydantic model
        warehouse_dict = {
            "id": str(db_warehouse.id),
            "tenant_id": str(db_warehouse.tenant_id),
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing warehouse"""
    warehouse_update = warehouse.dict(exclude_unset=True)
    warehouse_update["updatedAt"] = datetime.utcnow()
    
    db_warehouse = update_warehouse(warehouse_id, warehouse_update, db, str(tenant_context["tenant_id"]))
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Convert SQLAlchemy model to Pydantic model
    warehouse_dict = {
        "id": str(db_warehouse.id),
        "tenant_id": str(db_warehouse.tenant_id),
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a warehouse"""
    success = delete_warehouse(warehouse_id, db, str(tenant_context["tenant_id"]))
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all storage locations for the current tenant"""
    if warehouse_id:
        locations = get_storage_locations_by_warehouse(warehouse_id, db, str(tenant_context["tenant_id"]), skip, limit)
    else:
        locations = get_storage_locations(db, str(tenant_context["tenant_id"]), skip, limit)
    total = len(locations)
    return StorageLocationsResponse(storageLocations=locations, total=total)

@router.get("/storage-locations/{location_id}", response_model=StorageLocationResponse)
def read_storage_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific storage location by ID"""
    location = get_storage_location_by_id(db, location_id, str(tenant_context["tenant_id"]))
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")
    return StorageLocationResponse(storageLocation=location)

@router.post("/storage-locations", response_model=StorageLocationResponse)
def create_storage_location_endpoint(
    location: StorageLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new storage location"""
    location_data = location.dict()
    location_data.update({
        "id": str(uuid.uuid4()),
        "tenant_id": str(tenant_context["tenant_id"]),
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing storage location"""
    location_update = location.dict(exclude_unset=True)
    location_update["updatedAt"] = datetime.utcnow()
    
    db_location = update_storage_location(db, location_id, location_update, str(tenant_context["tenant_id"]))
    if not db_location:
        raise HTTPException(status_code=404, detail="Storage location not found")
    
    return StorageLocationResponse(storageLocation=db_location)

@router.delete("/storage-locations/{location_id}")
def delete_storage_location_endpoint(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a storage location"""
    success = delete_storage_location(location_id, str(tenant_context["tenant_id"]), db)
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all stock movements for the current tenant"""
    movements = get_stock_movements(db, str(tenant_context["tenant_id"]), product_id, warehouse_id, skip, limit)
    
    # Convert each movement to response format (convert UUIDs to strings)
    response_movements = []
    for movement in movements:
        response_data = {
            "id": str(movement.id),
            "tenant_id": str(movement.tenant_id),
            "productId": movement.productId,
            "warehouseId": str(movement.warehouseId),
            "locationId": movement.locationId,
            "movementType": movement.movementType,
            "quantity": movement.quantity,
            "unitCost": movement.unitCost,
            "referenceNumber": movement.referenceNumber,
            "referenceType": movement.referenceType,
            "notes": movement.notes,
            "batchNumber": movement.batchNumber,
            "serialNumber": movement.serialNumber,
            "expiryDate": movement.expiryDate.isoformat() if movement.expiryDate else None,
            "status": movement.status,
            "createdBy": str(movement.createdBy),
            "createdAt": movement.createdAt,
            "updatedAt": movement.updatedAt
        }
        response_movements.append(response_data)
    
    total = len(response_movements)
    return StockMovementsResponse(stockMovements=response_movements, total=total)

# Customer Returns Endpoints

@router.post("/customer-returns", response_model=StockMovementResponse)
def create_customer_return(
    return_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new customer return"""
    # Convert to dict and ensure the movement type is RETURN and reference type is customer_return
    movement_data = return_data.dict()
    
    # Handle empty date strings - convert to None for database compatibility
    if movement_data.get("expiryDate") == "":
        movement_data["expiryDate"] = None
    
    movement_data.update({
        "movementType": "return",
        "referenceType": "customer_return",
        "tenant_id": str(tenant_context["tenant_id"]),
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    # Create the stock movement
    movement = create_stock_movement(movement_data, db)
    
    return StockMovementResponse(stockMovement=movement)

@router.get("/stock-movements/{movement_id}", response_model=StockMovementResponse)
def read_stock_movement(
    movement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific stock movement by ID"""
    movement = get_stock_movement_by_id(db, movement_id, str(tenant_context["tenant_id"]))
    if not movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    
    # Convert to response format (convert UUIDs to strings)
    response_data = {
        "id": str(movement.id),
        "tenant_id": str(movement.tenant_id),
        "productId": movement.productId,
        "warehouseId": str(movement.warehouseId),
        "locationId": movement.locationId,
        "movementType": movement.movementType,
        "quantity": movement.quantity,
        "unitCost": movement.unitCost,
        "referenceNumber": movement.referenceNumber,
        "referenceType": movement.referenceType,
        "notes": movement.notes,
        "batchNumber": movement.batchNumber,
        "serialNumber": movement.serialNumber,
        "expiryDate": movement.expiryDate.isoformat() if movement.expiryDate else None,
        "status": movement.status,
        "createdBy": str(movement.createdBy),
        "createdAt": movement.createdAt,
        "updatedAt": movement.updatedAt
    }
    
    return StockMovementResponse(stockMovement=response_data)

@router.post("/stock-movements", response_model=StockMovementResponse)
def create_stock_movement_endpoint(
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new stock movement"""
    tenant_id = str(tenant_context["tenant_id"])
    
    movement_data = movement.dict()
    
    # Handle empty date strings - convert to None for database compatibility
    if movement_data.get("expiryDate") == "":
        movement_data["expiryDate"] = None
    
    movement_data.update({
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_movement = create_stock_movement(movement_data, db)
    
    # Convert to response format (convert UUIDs to strings)
    response_data = {
        "id": str(db_movement.id),
        "tenant_id": str(db_movement.tenant_id),
        "productId": db_movement.productId,
        "warehouseId": str(db_movement.warehouseId),
        "locationId": db_movement.locationId,
        "movementType": db_movement.movementType,
        "quantity": db_movement.quantity,
        "unitCost": db_movement.unitCost,
        "referenceNumber": db_movement.referenceNumber,
        "referenceType": db_movement.referenceType,
        "notes": db_movement.notes,
        "batchNumber": db_movement.batchNumber,
        "serialNumber": db_movement.serialNumber,
        "expiryDate": db_movement.expiryDate.isoformat() if db_movement.expiryDate else None,
        "status": db_movement.status,
        "createdBy": str(db_movement.createdBy),
        "createdAt": db_movement.createdAt,
        "updatedAt": db_movement.updatedAt
    }
    
    return StockMovementResponse(stockMovement=response_data)

@router.put("/stock-movements/{movement_id}", response_model=StockMovementResponse)
def update_stock_movement_endpoint(
    movement_id: str,
    movement: StockMovementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing stock movement"""
    movement_update = movement.dict(exclude_unset=True)
    movement_update["updatedAt"] = datetime.utcnow()
    
    if "expiryDate" in movement_update and movement_update["expiryDate"] == "":
        movement_update["expiryDate"] = None
    
    db_movement = update_stock_movement(movement_id, movement_update, db, str(tenant_context["tenant_id"]))
    if not db_movement:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    
    # Convert to response format (convert UUIDs to strings)
    response_data = {
        "id": str(db_movement.id),
        "tenant_id": str(db_movement.tenant_id),
        "productId": db_movement.productId,
        "warehouseId": str(db_movement.warehouseId),
        "locationId": db_movement.locationId,
        "movementType": db_movement.movementType,
        "quantity": db_movement.quantity,
        "unitCost": db_movement.unitCost,
        "referenceNumber": db_movement.referenceNumber,
        "referenceType": db_movement.referenceType,
        "notes": db_movement.notes,
        "batchNumber": db_movement.batchNumber,
        "serialNumber": db_movement.serialNumber,
        "expiryDate": db_movement.expiryDate.isoformat() if db_movement.expiryDate else None,
        "status": db_movement.status,
        "createdBy": str(db_movement.createdBy),
        "createdAt": db_movement.createdAt,
        "updatedAt": db_movement.updatedAt
    }
    
    return StockMovementResponse(stockMovement=response_data)

@router.delete("/stock-movements/{movement_id}")
def delete_stock_movement_endpoint(
    movement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a stock movement"""
    success = delete_stock_movement(movement_id, db, str(tenant_context["tenant_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Stock movement not found")
    return {"message": "Stock movement deleted successfully"}


# Purchase Order Endpoints
@router.get("/purchase-orders", response_model=PurchaseOrdersResponse)
def read_purchase_orders(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all purchase orders for the current tenant"""
    if status:
        orders = get_purchase_orders_by_status(status, db, str(tenant_context["tenant_id"]), skip, limit)
    else:
        orders = get_purchase_orders(db, str(tenant_context["tenant_id"]), skip, limit)
    
    total = len(orders)
    
    # Convert to response format
    response_orders = []
    for order in orders:
        response_data = {
            "id": str(order.id),
            "tenant_id": str(order.tenant_id),
            "orderNumber": order.poNumber,
            "supplierId": str(order.supplierId),
            "supplierName": "",  # Not stored in DB, will be empty
            "warehouseId": str(order.warehouseId),
            "orderDate": order.orderDate.isoformat() if order.orderDate else None,
            "expectedDeliveryDate": order.expectedDeliveryDate.isoformat() if order.expectedDeliveryDate else None,
            "status": order.status,
            "totalAmount": order.totalAmount,
            "notes": order.notes,
            "items": order.items if order.items else [],
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific purchase order by ID"""
    order = get_purchase_order_by_id(order_id, db, str(tenant_context["tenant_id"]))
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Convert to response format
    response_data = {
        "id": str(order.id),
        "tenant_id": str(order.tenant_id),
        "orderNumber": order.poNumber,
        "batchNumber": order.batchNumber,
        "supplierId": str(order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(order.warehouseId),
        "orderDate": order.orderDate.isoformat() if order.orderDate else None,
        "expectedDeliveryDate": order.expectedDeliveryDate.isoformat() if order.expectedDeliveryDate else None,
        "status": order.status,
        "totalAmount": order.totalAmount,
        "notes": order.notes,
        "items": order.items if order.items else [],
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new purchase order"""
    # Calculate total amount from items
    total_amount = sum(item.totalCost for item in order.items)
    
    # Generate purchase order number if not provided
    if not order.orderNumber:
        order_number = generate_purchase_order_number(str(tenant_context["tenant_id"]), db)
    else:
        order_number = order.orderNumber
    
    order_data = order.dict()
    order_data["poNumber"] = order_number
    # Remove fields that don't exist in SQLAlchemy model
    order_data.pop("supplierName", None)
    order_data.pop("orderNumber", None)
    # Keep items - they are stored as JSON in the database
    
    # Convert date strings to date objects
    if order_data.get("orderDate"):
        order_data["orderDate"] = datetime.strptime(order_data["orderDate"], "%Y-%m-%d").date()
    if order_data.get("expectedDeliveryDate"):
        order_data["expectedDeliveryDate"] = datetime.strptime(order_data["expectedDeliveryDate"], "%Y-%m-%d").date()
    
    order_data.update({
        "id": str(uuid.uuid4()),
        "tenant_id": str(tenant_context["tenant_id"]),
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
        "tenant_id": str(db_order.tenant_id),
        "orderNumber": db_order.poNumber,
        "batchNumber": db_order.batchNumber,
        "supplierId": str(db_order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(db_order.warehouseId),
        "orderDate": db_order.orderDate.isoformat() if db_order.orderDate else None,
        "expectedDeliveryDate": db_order.expectedDeliveryDate.isoformat() if db_order.expectedDeliveryDate else None,
        "status": db_order.status,
        "totalAmount": db_order.totalAmount,
        "notes": db_order.notes,
        "items": db_order.items if db_order.items else [],
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
    tenant_context: dict = Depends(get_tenant_context)
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
    
    db_order = update_purchase_order(order_id, order_update, db, str(tenant_context["tenant_id"]))
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Convert to response format
    response_data = {
        "id": str(db_order.id),
        "tenant_id": str(db_order.tenant_id),
        "orderNumber": db_order.poNumber,
        "batchNumber": db_order.batchNumber,
        "supplierId": str(db_order.supplierId),
        "supplierName": "",  # Not stored in DB, will be empty
        "warehouseId": str(db_order.warehouseId),
        "orderDate": db_order.orderDate.isoformat() if db_order.orderDate else None,
        "expectedDeliveryDate": db_order.expectedDeliveryDate.isoformat() if db_order.expectedDeliveryDate else None,
        "status": db_order.status,
        "totalAmount": db_order.totalAmount,
        "notes": db_order.notes,
        "items": db_order.items if db_order.items else [],
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a purchase order"""
    success = delete_purchase_order(order_id, db, str(tenant_context["tenant_id"]))
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
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all receivings for the current tenant"""
    receivings = get_receivings(db, str(tenant_context["tenant_id"]), status, skip, limit)
    total = len(receivings)
    
    # Convert to response format (convert UUIDs to strings)
    response_receivings = []
    for receiving in receivings:
        response_data = {
            "id": str(receiving.id),
            "tenant_id": str(receiving.tenant_id),
            "receivingNumber": receiving.receivingNumber,
            "purchaseOrderId": str(receiving.purchaseOrderId),
            "warehouseId": str(receiving.warehouseId),
            "receivedDate": receiving.receivedDate.isoformat() if receiving.receivedDate else None,
            "status": receiving.status,
            "receivedBy": str(receiving.receivedBy),
            "notes": receiving.notes,
            "items": receiving.items or [],
            "createdBy": str(receiving.receivedBy), 
            "createdAt": receiving.createdAt,
            "updatedAt": receiving.updatedAt
        }
        response_receivings.append(response_data)
    
    return ReceivingsResponse(receivings=response_receivings, total=total)

@router.get("/receivings/{receiving_id}", response_model=ReceivingResponse)
def read_receiving(
    receiving_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific receiving by ID"""
    receiving = get_receiving_by_id(db, receiving_id, str(tenant_context["tenant_id"]))
    if not receiving:
        raise HTTPException(status_code=404, detail="Receiving not found")
    
    # Convert to response format (convert UUIDs to strings)
    response_data = {
        "id": str(receiving.id),
        "tenant_id": str(receiving.tenant_id),
        "receivingNumber": receiving.receivingNumber,
        "purchaseOrderId": str(receiving.purchaseOrderId),
        "warehouseId": str(receiving.warehouseId),
        "receivedDate": receiving.receivedDate.isoformat() if receiving.receivedDate else None,
        "status": receiving.status,
        "receivedBy": str(receiving.receivedBy),
        "notes": receiving.notes,
        "items": receiving.items or [],
        "createdBy": str(receiving.receivedBy),  # Map receivedBy to createdBy for Pydantic model
        "createdAt": receiving.createdAt,
        "updatedAt": receiving.updatedAt
    }
    
    return ReceivingResponse(receiving=response_data)

@router.post("/receivings", response_model=ReceivingResponse)
def create_receiving_endpoint(
    receiving: ReceivingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new receiving"""
    receiving_data = receiving.dict()
    
    # Generate unique receiving number if not provided
    if not receiving_data.get("receivingNumber"):
        receiving_data["receivingNumber"] = f"REC-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    receiving_data.update({
        "id": str(uuid.uuid4()),
        "tenant_id": str(tenant_context["tenant_id"]),
        "receivedBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    db_receiving = create_receiving(receiving_data, db)
    
    # Convert to response format (convert UUIDs to strings)
    response_data = {
        "id": str(db_receiving.id),
        "tenant_id": str(db_receiving.tenant_id),
        "receivingNumber": db_receiving.receivingNumber,
        "purchaseOrderId": str(db_receiving.purchaseOrderId),
        "warehouseId": str(db_receiving.warehouseId),
        "receivedDate": db_receiving.receivedDate.isoformat() if db_receiving.receivedDate else None,
        "status": db_receiving.status,
        "receivedBy": str(db_receiving.receivedBy),
        "notes": db_receiving.notes,
        "items": db_receiving.items or [],
        "createdBy": str(db_receiving.receivedBy),  # Map receivedBy to createdBy for Pydantic model
        "createdAt": db_receiving.createdAt,
        "updatedAt": db_receiving.updatedAt
    }
    
    return ReceivingResponse(receiving=response_data)

@router.put("/receivings/{receiving_id}", response_model=ReceivingResponse)
def update_receiving_endpoint(
    receiving_id: str,
    receiving: ReceivingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing receiving"""
    receiving_update = receiving.dict(exclude_unset=True)
    receiving_update["updatedAt"] = datetime.utcnow()
    
    db_receiving = update_receiving(db, receiving_id, receiving_update, str(tenant_context["tenant_id"]))
    if not db_receiving:
        raise HTTPException(status_code=404, detail="Receiving not found")
    
    return ReceivingResponse(receiving=db_receiving)

@router.delete("/receivings/{receiving_id}")
def delete_receiving_endpoint(
    receiving_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a receiving"""
    success = delete_receiving(receiving_id, db, str(tenant_context["tenant_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Receiving not found")
    return {"message": "Receiving deleted successfully"}

# Dashboard Endpoints
@router.get("/dashboard", response_model=InventoryDashboardStats)
def get_inventory_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get inventory dashboard statistics"""
    return get_inventory_dashboard_stats(db, str(tenant_context["tenant_id"]))

# Dumps Endpoints
@router.get("/dumps", response_model=StockMovementsWithProductResponse)
def get_dumps(
    warehouse_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all damaged items (dumps) for the current tenant"""
    from sqlalchemy.orm import joinedload
    
    # Query stock movements with product information
    from ...config.inventory_models import StockMovement, Product
    query = db.query(StockMovement).filter(
        StockMovement.tenant_id == tenant_context["tenant_id"],
        StockMovement.movementType == "damage"
    )
    
    if warehouse_id:
        query = query.filter(StockMovement.warehouseId == warehouse_id)
    
    movements = query.order_by(StockMovement.createdAt.desc()).offset(skip).limit(limit).all()
    
    # Convert each movement to response format with product details
    response_movements = []
    for movement in movements:
        # Get product details - convert string productId to UUID for comparison
        product = None
        try:
            from uuid import UUID
            product_uuid = UUID(movement.productId)
            
            # First try with the movement's tenant_id (more reliable)
            product = db.query(Product).filter(
                Product.id == product_uuid,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with the context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.id == product_uuid,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
                    
        except (ValueError, TypeError):
            # If productId is not a valid UUID, try to find by SKU
            product = db.query(Product).filter(
                Product.sku == movement.productId,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.sku == movement.productId,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
        
        response_data = {
            "id": str(movement.id),
            "tenant_id": str(movement.tenant_id),
            "productId": movement.productId,
            "productName": product.name if product else "Unknown Product",
            "productSku": product.sku if product else "N/A",
            "productCategory": product.category if product else "N/A",
            "warehouseId": str(movement.warehouseId),
            "locationId": movement.locationId,
            "movementType": movement.movementType,
            "quantity": movement.quantity,
            "unitCost": movement.unitCost,
            "referenceNumber": movement.referenceNumber,
            "referenceType": movement.referenceType,
            "notes": movement.notes,
            "batchNumber": movement.batchNumber,
            "serialNumber": movement.serialNumber,
            "expiryDate": movement.expiryDate.isoformat() if movement.expiryDate else None,
            "status": movement.status,
            "createdBy": str(movement.createdBy),
            "createdAt": movement.createdAt,
            "updatedAt": movement.updatedAt
        }
        
        response_movements.append(response_data)
    
    total = len(response_movements)
    return StockMovementsWithProductResponse(stockMovements=response_movements, total=total)

# Customer Returns Endpoints
@router.get("/customer-returns", response_model=StockMovementsWithProductResponse)
def get_customer_returns(
    warehouse_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all customer returns for the current tenant"""
    from ...config.inventory_models import StockMovement, Product
    
    query = db.query(StockMovement).filter(
        StockMovement.tenant_id == tenant_context["tenant_id"],
        StockMovement.referenceType == "customer_return"
    )
    
    if warehouse_id:
        query = query.filter(StockMovement.warehouseId == warehouse_id)
    
    movements = query.order_by(StockMovement.createdAt.desc()).offset(skip).limit(limit).all()
    
    # Convert each movement to response format with product details
    response_movements = []
    for movement in movements:
        # Get product details - convert string productId to UUID for comparison
        product = None
        try:
            from uuid import UUID
            product_uuid = UUID(movement.productId)
            
            # First try with the movement's tenant_id (more reliable)
            product = db.query(Product).filter(
                Product.id == product_uuid,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with the context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.id == product_uuid,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
                    
        except (ValueError, TypeError):
            # If productId is not a valid UUID, try to find by SKU
            product = db.query(Product).filter(
                Product.sku == movement.productId,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.sku == movement.productId,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
        
        response_data = {
            "id": str(movement.id),
            "tenant_id": str(movement.tenant_id),
            "productId": movement.productId,
            "productName": product.name if product else "Unknown Product",
            "productSku": product.sku if product else "N/A",
            "productCategory": product.category if product else "N/A",
            "warehouseId": str(movement.warehouseId),
            "locationId": movement.locationId,
            "movementType": movement.movementType,
            "quantity": movement.quantity,
            "unitCost": movement.unitCost,
            "referenceNumber": movement.referenceNumber,
            "referenceType": movement.referenceType,
            "notes": movement.notes,
            "batchNumber": movement.batchNumber,
            "serialNumber": movement.serialNumber,
            "expiryDate": movement.expiryDate.isoformat() if movement.expiryDate else None,
            "status": movement.status,
            "createdBy": str(movement.createdBy),
            "createdAt": movement.createdAt,
            "updatedAt": movement.updatedAt
        }
        response_movements.append(response_data)
    
    total = len(response_movements)
    return StockMovementsWithProductResponse(stockMovements=response_movements, total=total)

@router.post("/customer-returns", response_model=StockMovementResponse)
def create_customer_return(
    return_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new customer return"""
    # Convert to dict and ensure the movement type is RETURN and reference type is customer_return
    movement_data = return_data.dict()
    
    # Handle empty date strings - convert to None for database compatibility
    if movement_data.get("expiryDate") == "":
        movement_data["expiryDate"] = None
    
    movement_data.update({
        "movementType": "return",
        "referenceType": "customer_return",
        "tenant_id": str(tenant_context["tenant_id"]),
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    # Create the stock movement
    movement = create_stock_movement(movement_data, db)
    
    return StockMovementResponse(stockMovement=movement)

# Supplier Returns Endpoints
@router.get("/supplier-returns", response_model=StockMovementsWithProductResponse)
def get_supplier_returns(
    warehouse_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all supplier returns for the current tenant"""
    from ...config.inventory_models import StockMovement, Product
    
    query = db.query(StockMovement).filter(
        StockMovement.tenant_id == tenant_context["tenant_id"],
        StockMovement.referenceType == "supplier_return"
    )
    
    if warehouse_id:
        query = query.filter(StockMovement.warehouseId == warehouse_id)
    
    movements = query.order_by(StockMovement.createdAt.desc()).offset(skip).limit(limit).all()
    
    # Convert each movement to response format with product details
    response_movements = []
    for movement in movements:
        # Get product details - convert string productId to UUID for comparison
        product = None
        try:
            from uuid import UUID
            product_uuid = UUID(movement.productId)
            
            # First try with the movement's tenant_id (more reliable)
            product = db.query(Product).filter(
                Product.id == product_uuid,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with the context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.id == product_uuid,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
                    
        except (ValueError, TypeError):
            # If productId is not a valid UUID, try to find by SKU
            product = db.query(Product).filter(
                Product.sku == movement.productId,
                Product.tenant_id == movement.tenant_id
            ).first()
            
            # If not found, try with context tenant_id
            if not product:
                product = db.query(Product).filter(
                    Product.sku == movement.productId,
                    Product.tenant_id == tenant_context["tenant_id"]
                ).first()
        
        response_data = {
            "id": str(movement.id),
            "tenant_id": str(movement.tenant_id),
            "productId": movement.productId,
            "productName": product.name if product else "Unknown Product",
            "productSku": product.sku if product else "N/A",
            "productCategory": product.category if product else "N/A",
            "warehouseId": str(movement.warehouseId),
            "locationId": movement.locationId,
            "movementType": movement.movementType,
            "quantity": movement.quantity,
            "unitCost": movement.unitCost,
            "referenceNumber": movement.referenceNumber,
            "referenceType": movement.referenceType,
            "notes": movement.notes,
            "batchNumber": movement.batchNumber,
            "serialNumber": movement.serialNumber,
            "expiryDate": movement.expiryDate.isoformat() if movement.expiryDate else None,
            "status": movement.status,
            "createdBy": str(movement.createdBy),
            "createdAt": movement.createdAt,
            "updatedAt": movement.updatedAt
        }
        response_movements.append(response_data)
    
    total = len(response_movements)
    return StockMovementsWithProductResponse(stockMovements=response_movements, total=total)

@router.post("/supplier-returns", response_model=StockMovementResponse)
def create_supplier_return(
    return_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new supplier return"""
    # Convert to dict and ensure the movement type is RETURN and reference type is supplier_return
    movement_data = return_data.dict()
    
    # Handle empty date strings - convert to None for database compatibility
    if movement_data.get("expiryDate") == "":
        movement_data["expiryDate"] = None
    
    movement_data.update({
        "movementType": "return",
        "referenceType": "supplier_return",
        "tenant_id": str(tenant_context["tenant_id"]),
        "createdBy": str(current_user.id),
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    # Create the stock movement
    movement = create_stock_movement(movement_data, db)
    
    return StockMovementResponse(stockMovement=movement)
