from dataclasses import dataclass
from typing import Optional
from ....core.searchable_query import ISearchableQuery

@dataclass
class GetAllJobPostingsQuery:
    page: int = 1
    page_size: int = 10
    search_term: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = 'asc'
    tenant_id: Optional[str] = None
    
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

