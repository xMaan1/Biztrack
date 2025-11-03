from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingRepository
from ....domain.entities.hrm_entity import Training
from .query import GetTrainingByIdQuery

class GetTrainingByIdHandler(RequestHandlerBase[GetTrainingByIdQuery, Result[Optional[Training]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTrainingByIdQuery) -> Result[Optional[Training]]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingRepository(uow.session)
                entity = repo.get_by_id(query.training_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get training: {str(e)}")
