from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JournalEntryRepository
from ....domain.entities.ledger_entity import JournalEntry
from .command import CreateJournalEntryCommand

class CreateJournalEntryHandler(RequestHandlerBase[CreateJournalEntryCommand, Result[JournalEntry]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateJournalEntryCommand) -> Result[JournalEntry]:
        try:
            with self._unit_of_work as uow:
                repo = JournalEntryRepository(uow.session)
                
                journalentry = JournalEntry(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    attachments=command.attachments or [],
                    created_by=uuid.UUID(command.created_by),
                    description=command.description,
                    entry_date=datetime.fromisoformat(command.entry_date.replace('Z', '+00:00')) if command.entry_date else datetime.utcnow(),
                    entry_number=command.entry_number,
                    is_posted=command.is_posted,
                    notes=command.notes,
                    posted_at=datetime.fromisoformat(command.posted_at.replace('Z', '+00:00')) if command.posted_at else None,
                    posted_by=uuid.UUID(command.posted_by),
                    reference_number=command.reference_number,
                    status=command.status,
                    tags=command.tags or [],
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(journalentry)
                uow.commit()
                return Result.success(journalentry)
                
        except Exception as e:
            return Result.failure(f"Failed to create journalentry: {str(e)}")
