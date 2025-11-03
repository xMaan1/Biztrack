from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JobPostingRepository
from ....domain.entities.hrm_entity import JobPosting
from .query import GetJobPostingByIdQuery

class GetJobPostingByIdHandler(RequestHandlerBase[GetJobPostingByIdQuery, Result[Optional[JobPosting]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetJobPostingByIdQuery) -> Result[Optional[JobPosting]]:
        try:
            with self._unit_of_work as uow:
                repo = JobPostingRepository(uow.session)
                entity = repo.get_by_id(query.jobposting_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get job posting: {str(e)}")

