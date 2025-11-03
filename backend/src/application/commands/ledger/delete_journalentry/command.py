from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteJournalEntryCommand(ICommand):
    tenant_id: str
    journalentry_id: str
