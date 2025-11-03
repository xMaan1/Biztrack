from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetFinancialPeriodByIdQuery(IQuery):
    tenant_id: str
    financialperiod_id: str
