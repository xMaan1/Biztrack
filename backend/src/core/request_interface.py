from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

TResult = TypeVar('TResult')

class IRequest(ABC, Generic[TResult]):
    pass

