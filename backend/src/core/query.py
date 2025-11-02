from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from .request_interface import IRequest

TResult = TypeVar('TResult')

class IQuery(IRequest[TResult], Generic[TResult]):
    pass

class IQueryHandler(ABC, Generic[TResult]):
    @abstractmethod
    async def handle(self, query: IQuery[TResult]) -> TResult:
        pass

