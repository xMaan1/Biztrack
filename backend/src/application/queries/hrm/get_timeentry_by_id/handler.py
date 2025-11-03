from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TimeEntryRepository
from ....domain.entities.hrm_entity import TimeEntry
from .query import GetTimeEntryByIdQuery

class GetTimeEntryByIdHandler(RequestHandlerBase[GetTimeEntryByIdQuery, Result[Optional[TimeEntry]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTimeEntryByIdQuery) -> Result[Optional[TimeEntry]]:
        try:
            with self._unit_of_work as uow:
                repo = TimeEntryRepository(uow.session)
                entity = repo.get_by_id(query.timeentry_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get timeentry: {str(e)}")
