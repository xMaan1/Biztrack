from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetAllBankAccountsQuery:
    page: int = 1
    page_size: int = 10
    tenant_id: str = None
    active_only: bool = False
    
    def __post_init__(self):
        if self.page < 1:
            raise ValueError("Page must be greater than 0")
        if self.page_size < 1:
            raise ValueError("Page size must be greater than 0")
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

