from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityCheckRepository
from ....domain.entities.quality_control_entity import QualityCheck
from .query import GetQualityCheckByIdQuery

class GetQualityCheckByIdHandler(RequestHandlerBase[GetQualityCheckByIdQuery, Result[Optional[QualityCheck]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetQualityCheckByIdQuery) -> Result[Optional[QualityCheck]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityCheckRepository(uow.session)
                entity = repo.get_by_id(query.qualitycheck_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get qualitycheck: {str(e)}")
