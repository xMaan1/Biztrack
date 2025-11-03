from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityInspectionRepository
from ....domain.entities.quality_control_entity import QualityInspection
from .query import GetQualityInspectionByIdQuery

class GetQualityInspectionByIdHandler(RequestHandlerBase[GetQualityInspectionByIdQuery, Result[Optional[QualityInspection]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetQualityInspectionByIdQuery) -> Result[Optional[QualityInspection]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityInspectionRepository(uow.session)
                entity = repo.get_by_id(query.qualityinspection_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get qualityinspection: {str(e)}")
