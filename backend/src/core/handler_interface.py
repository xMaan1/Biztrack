from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from .request_interface import IRequest

TRequest = TypeVar('TRequest', bound=IRequest)
TResponse = TypeVar('TResponse')

class IRequestHandler(ABC, Generic[TRequest, TResponse]):
    @abstractmethod
    async def handle(self, request: TRequest) -> TResponse:
        pass

