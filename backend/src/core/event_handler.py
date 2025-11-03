from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from .event_interface import IEvent

TEvent = TypeVar('TEvent', bound=IEvent)

class IEventHandler(ABC, Generic[TEvent]):
    @abstractmethod
    async def handle(self, event: TEvent) -> None:
        pass

