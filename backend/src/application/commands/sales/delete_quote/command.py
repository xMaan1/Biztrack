from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteQuoteCommand(ICommand):
    tenant_id: str
    quote_id: str
