from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.inventory_entity import Product, Warehouse, PurchaseOrder, Receiving, StorageLocation, StockMovement

class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: Session):
        super().__init__(session, Product)

    def get_by_sku(self, sku: str, tenant_id: Optional[str] = None) -> Optional[Product]:
        query = self._session.query(Product).filter(Product.sku == sku)
        if tenant_id:
            query = query.filter(Product.tenant_id == tenant_id)
        return query.first()

class WarehouseRepository(BaseRepository[Warehouse]):
    def __init__(self, session: Session):
        super().__init__(session, Warehouse)

    def get_by_code(self, code: str, tenant_id: Optional[str] = None) -> Optional[Warehouse]:
        query = self._session.query(Warehouse).filter(Warehouse.code == code)
        if tenant_id:
            query = query.filter(Warehouse.tenant_id == tenant_id)
        return query.first()

class PurchaseOrderRepository(BaseRepository[PurchaseOrder]):
    def __init__(self, session: Session):
        super().__init__(session, PurchaseOrder)

    def get_by_po_number(self, po_number: str, tenant_id: Optional[str] = None) -> Optional[PurchaseOrder]:
        query = self._session.query(PurchaseOrder).filter(PurchaseOrder.poNumber == po_number)
        if tenant_id:
            query = query.filter(PurchaseOrder.tenant_id == tenant_id)
        return query.first()

class ReceivingRepository(BaseRepository[Receiving]):
    def __init__(self, session: Session):
        super().__init__(session, Receiving)

    def get_by_purchase_order(self, purchase_order_id: str, tenant_id: Optional[str] = None) -> List[Receiving]:
        query = self._session.query(Receiving).filter(Receiving.purchaseOrderId == purchase_order_id)
        if tenant_id:
            query = query.filter(Receiving.tenant_id == tenant_id)
        return query.all()

class StorageLocationRepository(BaseRepository[StorageLocation]):
    def __init__(self, session: Session):
        super().__init__(session, StorageLocation)

    def get_by_warehouse(self, warehouse_id: str, tenant_id: Optional[str] = None) -> List[StorageLocation]:
        query = self._session.query(StorageLocation).filter(StorageLocation.warehouseId == warehouse_id)
        if tenant_id:
            query = query.filter(StorageLocation.tenant_id == tenant_id)
        return query.all()

class StockMovementRepository(BaseRepository[StockMovement]):
    def __init__(self, session: Session):
        super().__init__(session, StockMovement)

    def get_by_warehouse(self, warehouse_id: str, tenant_id: Optional[str] = None) -> List[StockMovement]:
        query = self._session.query(StockMovement).filter(StockMovement.warehouseId == warehouse_id)
        if tenant_id:
            query = query.filter(StockMovement.tenant_id == tenant_id)
        return query.all()

    def get_by_product(self, product_id: str, tenant_id: Optional[str] = None) -> List[StockMovement]:
        query = self._session.query(StockMovement).filter(StockMovement.productId == product_id)
        if tenant_id:
            query = query.filter(StockMovement.tenant_id == tenant_id)
        return query.all()

