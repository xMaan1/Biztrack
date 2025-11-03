from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JournalEntryRepository
from .command import DeleteJournalEntryCommand

class DeleteJournalEntryHandler(RequestHandlerBase[DeleteJournalEntryCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteJournalEntryCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = JournalEntryRepository(uow.session)
                
                journalentry = repo.get_by_id(command.journalentry_id, command.tenant_id)
                if not journalentry:
                    return Result.failure("JournalEntry not found")
                
                repo.delete(journalentry)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete journalentry: {str(e)}")
