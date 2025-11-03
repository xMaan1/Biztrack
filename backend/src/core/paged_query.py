from typing import Generic, TypeVar
from .query import IQuery

TResult = TypeVar('TResult')

class IPagedQuery(IQuery[TResult], Generic[TResult]):
    page: int
    page_size: int
    
    def __init__(self, page: int = 1, page_size: int = 10):
        if page < 1:
            raise ValueError("Page must be greater than 0")
        if page_size < 1:
            raise ValueError("Page size must be greater than 0")
        self.page = page
        self.page_size = page_size

