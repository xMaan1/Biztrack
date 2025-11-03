from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderTaskRepository
from ....domain.entities.workshop_entity import WorkOrderTask
from .query import GetWorkOrderTaskByIdQuery

class GetWorkOrderTaskByIdHandler(RequestHandlerBase[GetWorkOrderTaskByIdQuery, Result[Optional[WorkOrderTask]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetWorkOrderTaskByIdQuery) -> Result[Optional[WorkOrderTask]]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderTaskRepository(uow.session)
                entity = repo.get_by_id(query.workordertask_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get workordertask: {str(e)}")
