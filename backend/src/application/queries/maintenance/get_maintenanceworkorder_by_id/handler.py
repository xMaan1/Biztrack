from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceWorkOrderRepository
from ....domain.entities.maintenance_entity import MaintenanceWorkOrder
from .query import GetMaintenanceWorkOrderByIdQuery

class GetMaintenanceWorkOrderByIdHandler(RequestHandlerBase[GetMaintenanceWorkOrderByIdQuery, Result[Optional[MaintenanceWorkOrder]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetMaintenanceWorkOrderByIdQuery) -> Result[Optional[MaintenanceWorkOrder]]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceWorkOrderRepository(uow.session)
                entity = repo.get_by_id(query.maintenanceworkorder_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get maintenanceworkorder: {str(e)}")
