from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityReportRepository
from ....domain.entities.quality_control_entity import QualityReport
from .query import GetQualityReportByIdQuery

class GetQualityReportByIdHandler(RequestHandlerBase[GetQualityReportByIdQuery, Result[Optional[QualityReport]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetQualityReportByIdQuery) -> Result[Optional[QualityReport]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityReportRepository(uow.session)
                entity = repo.get_by_id(query.qualityreport_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get qualityreport: {str(e)}")
