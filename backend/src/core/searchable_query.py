from typing import Generic, TypeVar, Optional
from .paged_query import IPagedQuery

TResult = TypeVar('TResult')

class ISearchableQuery(IPagedQuery[TResult], Generic[TResult]):
    search_term: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = None

    def __init__(
        self,
        page: int = 1,
        page_size: int = 10,
        search_term: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ):
        super().__init__(page, page_size)
        self.search_term = search_term
        self.sort_by = sort_by
        self.sort_order = sort_order or 'asc'
        
        if self.sort_order not in ['asc', 'desc']:
            raise ValueError("Sort order must be 'asc' or 'desc'")

