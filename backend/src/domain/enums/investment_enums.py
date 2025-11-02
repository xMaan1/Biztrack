import enum

class InvestmentType(str, enum.Enum):
    CASH_INVESTMENT = "cash_investment"
    CARD_TRANSFER = "card_transfer"
    BANK_TRANSFER = "bank_transfer"
    EQUIPMENT_PURCHASE = "equipment_purchase"

class InvestmentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

