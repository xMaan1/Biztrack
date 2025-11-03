from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceReportRepository
from ....domain.entities.maintenance_entity import MaintenanceReport
from .query import GetMaintenanceReportByIdQuery

class GetMaintenanceReportByIdHandler(RequestHandlerBase[GetMaintenanceReportByIdQuery, Result[Optional[MaintenanceReport]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetMaintenanceReportByIdQuery) -> Result[Optional[MaintenanceReport]]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceReportRepository(uow.session)
                entity = repo.get_by_id(query.maintenancereport_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get maintenancereport: {str(e)}")
