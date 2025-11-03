import enum

class NotificationType(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"
    SYSTEM = "system"

class NotificationCategory(str, enum.Enum):
    HRM = "hrm"
    INVENTORY = "inventory"
    CRM = "crm"
    PRODUCTION = "production"
    QUALITY = "quality"
    MAINTENANCE = "maintenance"
    LEDGER = "ledger"
    SYSTEM = "system"

