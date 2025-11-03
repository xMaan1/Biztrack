from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetQuoteByIdQuery(IQuery):
    tenant_id: str
    quote_id: str
