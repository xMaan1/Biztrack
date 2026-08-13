from enum import Enum


class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    DROPPED = "dropped"
    COMPLETED = "completed"
    PENDING = "pending"


__all__ = [
    "EnrollmentStatus",
]
