from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PurchaseOrderRepository
from ....domain.entities.inventory_entity import PurchaseOrder
from .command import UpdatePurchaseOrderCommand

class UpdatePurchaseOrderHandler(RequestHandlerBase[UpdatePurchaseOrderCommand, Result[PurchaseOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePurchaseOrderCommand) -> Result[PurchaseOrder]:
        try:
            with self._unit_of_work as uow:
                repo = PurchaseOrderRepository(uow.session)
                
                purchaseorder = repo.get_by_id(command.purchaseorder_id, command.tenant_id)
                if not purchaseorder:
                    return Result.failure("PurchaseOrder not found")
                
                                if command.approvedAt is not None:
                    purchaseorder.approvedAt = datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt else None
                if command.approvedBy is not None:
                    purchaseorder.approvedBy = uuid.UUID(command.approvedBy) if command.approvedBy else None
                if command.batchNumber is not None:
                    purchaseorder.batchNumber = command.batchNumber
                if command.createdBy is not None:
                    purchaseorder.createdBy = command.createdBy
                if command.expectedDeliveryDate is not None:
                    purchaseorder.expectedDeliveryDate = datetime.strptime(command.expectedDeliveryDate, "%Y-%m-%d").date() if command.expectedDeliveryDate else None
                if command.items is not None:
                    purchaseorder.items = command.items or []
                if command.notes is not None:
                    purchaseorder.notes = command.notes
                if command.orderDate is not None:
                    purchaseorder.orderDate = datetime.strptime(command.orderDate, "%Y-%m-%d").date() if command.orderDate else None
                if command.poNumber is not None:
                    purchaseorder.poNumber = command.poNumber
                if command.status is not None:
                    purchaseorder.status = command.status
                if command.subtotal is not None:
                    purchaseorder.subtotal = command.subtotal
                if command.supplierId is not None:
                    purchaseorder.supplierId = uuid.UUID(command.supplierId) if command.supplierId else None
                if command.totalAmount is not None:
                    purchaseorder.totalAmount = command.totalAmount
                if command.vatAmount is not None:
                    purchaseorder.vatAmount = command.vatAmount
                if command.vatRate is not None:
                    purchaseorder.vatRate = command.vatRate
                if command.warehouseId is not None:
                    purchaseorder.warehouseId = uuid.UUID(command.warehouseId) if command.warehouseId else None
                
                purchaseorder.updatedAt = datetime.utcnow()
                repo.update(purchaseorder)
                uow.commit()
                
                return Result.success(purchaseorder)
                
        except Exception as e:
            return Result.failure(f"Failed to update purchaseorder: {str(e)}")
