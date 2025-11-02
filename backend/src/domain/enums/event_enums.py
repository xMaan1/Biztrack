import enum

class EventType(str, enum.Enum):
    MEETING = "meeting"
    WORKSHOP = "workshop"
    DEADLINE = "deadline"
    OTHER = "other"

class EventStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrenceType(str, enum.Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

