from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JournalEntryRepository
from ....domain.entities.ledger_entity import JournalEntry
from .query import GetJournalEntryByIdQuery

class GetJournalEntryByIdHandler(RequestHandlerBase[GetJournalEntryByIdQuery, Result[Optional[JournalEntry]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetJournalEntryByIdQuery) -> Result[Optional[JournalEntry]]:
        try:
            with self._unit_of_work as uow:
                repo = JournalEntryRepository(uow.session)
                entity = repo.get_by_id(query.journalentry_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get journalentry: {str(e)}")
