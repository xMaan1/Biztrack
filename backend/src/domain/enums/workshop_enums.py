import enum

class WorkOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class WorkOrderPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class WorkOrderType(str, enum.Enum):
    PRODUCTION = "production"
    MAINTENANCE = "maintenance"
    REPAIR = "repair"
    INSTALLATION = "installation"
    INSPECTION = "inspection"

