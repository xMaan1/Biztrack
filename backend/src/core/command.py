from abc import ABC, abstractmethod
from typing import Any
from .request_interface import IRequest

class ICommand(IRequest[None]):
    pass

class ICommandHandler(ABC):
    @abstractmethod
    async def handle(self, command: ICommand) -> None:
        pass

