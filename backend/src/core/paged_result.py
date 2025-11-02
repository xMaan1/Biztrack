from typing import Generic, List, TypeVar, Optional
from dataclasses import dataclass

TValue = TypeVar('TValue')

@dataclass
class PagedResult(Generic[TValue]):
    items: List[TValue]
    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_previous_page: bool
    has_next_page: bool

    def __init__(
        self,
        items: List[TValue],
        page: int,
        page_size: int,
        total_count: int
    ):
        self.items = items
        self.page = page
        self.page_size = page_size
        self.total_count = total_count
        self.total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 0
        self.has_previous_page = page > 1
        self.has_next_page = page < self.total_pages

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

