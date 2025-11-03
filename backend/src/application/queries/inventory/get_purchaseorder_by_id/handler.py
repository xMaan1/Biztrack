from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PurchaseOrderRepository
from ....domain.entities.inventory_entity import PurchaseOrder
from .query import GetPurchaseOrderByIdQuery

class GetPurchaseOrderByIdHandler(RequestHandlerBase[GetPurchaseOrderByIdQuery, Result[Optional[PurchaseOrder]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetPurchaseOrderByIdQuery) -> Result[Optional[PurchaseOrder]]:
        try:
            with self._unit_of_work as uow:
                repo = PurchaseOrderRepository(uow.session)
                entity = repo.get_by_id(query.purchaseorder_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get purchaseorder: {str(e)}")
