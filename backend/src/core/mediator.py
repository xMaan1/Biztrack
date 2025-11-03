from typing import Dict, Type, Any, Callable, TypeVar, Generic
from .request_interface import IRequest
from .handler_interface import IRequestHandler
from .result import Result
import logging

logger = logging.getLogger(__name__)

TRequest = TypeVar('TRequest', bound=IRequest)
TResponse = TypeVar('TResponse')

class Mediator:
    def __init__(self):
        self._handlers: Dict[Type[IRequest], Callable] = {}

    def register_handler(
        self,
        request_type: Type[TRequest],
        handler: IRequestHandler[TRequest, TResponse]
    ) -> None:
        self._handlers[request_type] = handler
        logger.debug(f"Registered handler for {request_type.__name__}")

    async def send(self, request: IRequest) -> Any:
        request_type = type(request)
        
        if request_type not in self._handlers:
            raise ValueError(
                f"No handler registered for request type: {request_type.__name__}"
            )
        
        handler = self._handlers[request_type]
        logger.debug(f"Sending {request_type.__name__} to handler")
        
        try:
            result = await handler.handle(request)
            return result
        except Exception as e:
            logger.error(
                f"Error handling {request_type.__name__}: {str(e)}",
                exc_info=True
            )
            raise

    def unregister_handler(self, request_type: Type[IRequest]) -> None:
        if request_type in self._handlers:
            del self._handlers[request_type]
            logger.debug(f"Unregistered handler for {request_type.__name__}")

    def has_handler(self, request_type: Type[IRequest]) -> bool:
        return request_type in self._handlers

