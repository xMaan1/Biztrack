from dataclasses import dataclass
from typing import Optional

@dataclass
class GetAllSuppliersQuery:
    tenant_id: str
    page: int = 1
    page_size: int = 10
    sort_by: Optional[str] = None
    sort_order: str = 'asc'
    
    def __post_init__(self):
        if self.page < 1:
            raise ValueError("Page must be greater than 0")
        if self.page_size < 1:
            raise ValueError("Page size must be greater than 0")
        if self.sort_order not in ['asc', 'desc']:
            raise ValueError("Sort order must be 'asc' or 'desc'")
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size
