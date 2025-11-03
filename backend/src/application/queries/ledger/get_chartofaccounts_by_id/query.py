from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetChartOfAccountsByIdQuery(IQuery):
    tenant_id: str
    chartofaccounts_id: str
