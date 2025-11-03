from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingEnrollmentRepository
from ....domain.entities.hrm_entity import TrainingEnrollment
from .query import GetTrainingEnrollmentByIdQuery

class GetTrainingEnrollmentByIdHandler(RequestHandlerBase[GetTrainingEnrollmentByIdQuery, Result[Optional[TrainingEnrollment]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTrainingEnrollmentByIdQuery) -> Result[Optional[TrainingEnrollment]]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingEnrollmentRepository(uow.session)
                entity = repo.get_by_id(query.trainingenrollment_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get trainingenrollment: {str(e)}")
