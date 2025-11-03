from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetJournalEntryByIdQuery(IQuery):
    tenant_id: str
    journalentry_id: str
