from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Any
from .request_interface import IRequest
from .handler_interface import IRequestHandler

TRequest = TypeVar('TRequest', bound=IRequest)
TResponse = TypeVar('TResponse')

class RequestHandlerBase(IRequestHandler[TRequest, TResponse], ABC, Generic[TRequest, TResponse]):
    @abstractmethod
    async def handle(self, request: TRequest) -> TResponse:
        raise NotImplementedError("Subclasses must implement handle method")

