from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityDefectRepository
from ....domain.entities.quality_control_entity import QualityDefect
from .query import GetQualityDefectByIdQuery

class GetQualityDefectByIdHandler(RequestHandlerBase[GetQualityDefectByIdQuery, Result[Optional[QualityDefect]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetQualityDefectByIdQuery) -> Result[Optional[QualityDefect]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityDefectRepository(uow.session)
                entity = repo.get_by_id(query.qualitydefect_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get qualitydefect: {str(e)}")
