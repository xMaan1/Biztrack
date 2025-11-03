from datetime import datetime
import uuid
from datetime import date
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PurchaseOrderRepository
from ....domain.entities.inventory_entity import PurchaseOrder
from .command import CreatePurchaseOrderCommand

class CreatePurchaseOrderHandler(RequestHandlerBase[CreatePurchaseOrderCommand, Result[PurchaseOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePurchaseOrderCommand) -> Result[PurchaseOrder]:
        try:
            with self._unit_of_work as uow:
                repo = PurchaseOrderRepository(uow.session)
                
                purchaseorder = PurchaseOrder(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    createdBy=command.createdBy,
                    poNumber=command.poNumber,
                    supplierId=uuid.UUID(command.supplierId),
                    warehouseId=uuid.UUID(command.warehouseId),
                    orderDate=datetime.strptime(command.orderDate, "%Y-%m-%d").date() if isinstance(command.orderDate, str) else command.orderDate,
                    batchNumber=command.batchNumber,
                    expectedDeliveryDate=datetime.strptime(command.expectedDeliveryDate, "%Y-%m-%d").date() if command.expectedDeliveryDate and isinstance(command.expectedDeliveryDate, str) else command.expectedDeliveryDate,
                    status=command.status or "draft",
                    subtotal=command.subtotal,
                    vatRate=command.vatRate,
                    vatAmount=command.vatAmount,
                    totalAmount=command.totalAmount,
                    notes=command.notes,
                    items=command.items or [],
                    approvedBy=uuid.UUID(command.approvedBy) if command.approvedBy else None,
                    approvedAt=datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt and isinstance(command.approvedAt, str) else command.approvedAt,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(purchaseorder)
                uow.commit()
                return Result.success(purchaseorder)
                
        except Exception as e:
            return Result.failure(f"Failed to create purchaseorder: {str(e)}")
