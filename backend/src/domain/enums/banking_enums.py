import enum

class BankAccountType(str, enum.Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"
    CREDIT_LINE = "credit_line"
    MONEY_MARKET = "money_market"

class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"

class PaymentMethod(str, enum.Enum):
    ONLINE_TRANSFER = "online_transfer"
    DIRECT_DEBIT = "direct_debit"
    WIRE_TRANSFER = "wire_transfer"
    ACH = "ach"
    CHECK = "check"
    CASH = "cash"
    CARD_PAYMENT = "card_payment"
    MOBILE_PAYMENT = "mobile_payment"
    CRYPTOCURRENCY = "cryptocurrency"

class TillTransactionType(str, enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    ADJUSTMENT = "adjustment"

