from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderRepository
from ....domain.entities.workshop_entity import WorkOrder
from .query import GetWorkOrderByIdQuery

class GetWorkOrderByIdHandler(RequestHandlerBase[GetWorkOrderByIdQuery, Result[Optional[WorkOrder]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetWorkOrderByIdQuery) -> Result[Optional[WorkOrder]]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderRepository(uow.session)
                entity = repo.get_by_id(query.workorder_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get workorder: {str(e)}")
