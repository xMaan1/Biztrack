from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JournalEntryRepository
from ....domain.entities.ledger_entity import JournalEntry
from .command import UpdateJournalEntryCommand

class UpdateJournalEntryHandler(RequestHandlerBase[UpdateJournalEntryCommand, Result[JournalEntry]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateJournalEntryCommand) -> Result[JournalEntry]:
        try:
            with self._unit_of_work as uow:
                repo = JournalEntryRepository(uow.session)
                
                journalentry = repo.get_by_id(command.journalentry_id, command.tenant_id)
                if not journalentry:
                    return Result.failure("JournalEntry not found")
                
                                if command.attachments is not None:
                    journalentry.attachments = command.attachments or []
                if command.created_by is not None:
                    journalentry.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.description is not None:
                    journalentry.description = command.description
                if command.entry_date is not None:
                    journalentry.entry_date = datetime.fromisoformat(command.entry_date.replace('Z', '+00:00')) if command.entry_date else None
                if command.entry_number is not None:
                    journalentry.entry_number = command.entry_number
                if command.is_posted is not None:
                    journalentry.is_posted = command.is_posted
                if command.notes is not None:
                    journalentry.notes = command.notes
                if command.posted_at is not None:
                    journalentry.posted_at = datetime.fromisoformat(command.posted_at.replace('Z', '+00:00')) if command.posted_at else None
                if command.posted_by is not None:
                    journalentry.posted_by = uuid.UUID(command.posted_by) if command.posted_by else None
                if command.reference_number is not None:
                    journalentry.reference_number = command.reference_number
                if command.status is not None:
                    journalentry.status = command.status
                if command.tags is not None:
                    journalentry.tags = command.tags or []
                
                journalentry.updatedAt = datetime.utcnow()
                repo.update(journalentry)
                uow.commit()
                
                return Result.success(journalentry)
                
        except Exception as e:
            return Result.failure(f"Failed to update journalentry: {str(e)}")
