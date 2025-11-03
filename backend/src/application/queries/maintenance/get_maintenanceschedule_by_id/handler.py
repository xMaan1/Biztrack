from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceScheduleRepository
from ....domain.entities.maintenance_entity import MaintenanceSchedule
from .query import GetMaintenanceScheduleByIdQuery

class GetMaintenanceScheduleByIdHandler(RequestHandlerBase[GetMaintenanceScheduleByIdQuery, Result[Optional[MaintenanceSchedule]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetMaintenanceScheduleByIdQuery) -> Result[Optional[MaintenanceSchedule]]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceScheduleRepository(uow.session)
                entity = repo.get_by_id(query.maintenanceschedule_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get maintenanceschedule: {str(e)}")
