from typing import Generic, TypeVar, Optional, List
from dataclasses import dataclass

TValue = TypeVar('TValue')

@dataclass
class Result(Generic[TValue]):
    is_success: bool
    is_failure: bool
    value: Optional[TValue] = None
    error: Optional[str] = None
    errors: Optional[List[str]] = None

    @classmethod
    def success(cls, value: Optional[TValue] = None) -> 'Result[TValue]':
        return cls(
            is_success=True,
            is_failure=False,
            value=value
        )

    @classmethod
    def failure(cls, error: str, errors: Optional[List[str]] = None) -> 'Result[TValue]':
        return cls(
            is_success=False,
            is_failure=True,
            error=error,
            errors=errors or [error] if error else []
        )

    def __bool__(self) -> bool:
        return self.is_success

