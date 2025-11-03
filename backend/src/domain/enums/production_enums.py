import enum

class ProductionStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProductionPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProductionType(str, enum.Enum):
    BATCH = "batch"
    CONTINUOUS = "continuous"
    JOB_SHOP = "job_shop"
    ASSEMBLY = "assembly"
    CUSTOM = "custom"

