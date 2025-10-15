"""
Banking Pydantic Models for API
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import uuid

# Enums
class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"
    CREDIT_LINE = "credit_line"
    MONEY_MARKET = "money_market"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"

class PaymentMethod(str, Enum):
    ONLINE_TRANSFER = "online_transfer"
    DIRECT_DEBIT = "direct_debit"
    WIRE_TRANSFER = "wire_transfer"
    ACH = "ach"
    CHECK = "check"
    CASH = "cash"
    CARD_PAYMENT = "card_payment"
    MOBILE_PAYMENT = "mobile_payment"
    CRYPTOCURRENCY = "cryptocurrency"

# Bank Account Models
class BankAccountBase(BaseModel):
    account_name: str
    account_number: str
    routing_number: Optional[str] = None
    bank_name: str
    bank_code: Optional[str] = None
    account_type: BankAccountType
    currency: str = "USD"
    current_balance: float = 0.0
    available_balance: float = 0.0
    pending_balance: float = 0.0
    is_active: bool = True
    is_primary: bool = False
    supports_online_banking: bool = False
    description: Optional[str] = None
    tags: List[str] = []

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    routing_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    account_type: Optional[BankAccountType] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    supports_online_banking: Optional[bool] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class BankAccount(BankAccountBase):
    id: str
    tenant_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'tenant_id', 'created_by', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# Bank Transaction Models
class BankTransactionBase(BaseModel):
    bank_account_id: str
    transaction_date: datetime
    value_date: Optional[datetime] = None
    transaction_type: TransactionType
    status: TransactionStatus = TransactionStatus.PENDING
    amount: float
    currency: str = "USD"
    exchange_rate: float = 1.0
    base_amount: float
    payment_method: Optional[PaymentMethod] = None
    reference_number: Optional[str] = None
    external_reference: Optional[str] = None
    check_number: Optional[str] = None
    description: str
    memo: Optional[str] = None
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    counterparty_account: Optional[str] = None
    counterparty_bank: Optional[str] = None
    is_online_transaction: bool = False
    online_transaction_id: Optional[str] = None
    processing_fee: float = 0.0
    is_reconciled: bool = False
    reconciled_date: Optional[datetime] = None
    related_invoice_id: Optional[str] = None
    related_purchase_order_id: Optional[str] = None
    related_expense_id: Optional[str] = None
    tags: List[str] = []
    attachments: List[Dict[str, Any]] = []
    notes: Optional[str] = None

class BankTransactionCreate(BankTransactionBase):
    pass

class BankTransactionUpdate(BaseModel):
    transaction_date: Optional[datetime] = None
    value_date: Optional[datetime] = None
    transaction_type: Optional[TransactionType] = None
    status: Optional[TransactionStatus] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    base_amount: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    reference_number: Optional[str] = None
    external_reference: Optional[str] = None
    check_number: Optional[str] = None
    description: Optional[str] = None
    memo: Optional[str] = None
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    counterparty_account: Optional[str] = None
    counterparty_bank: Optional[str] = None
    is_online_transaction: Optional[bool] = None
    online_transaction_id: Optional[str] = None
    processing_fee: Optional[float] = None
    is_reconciled: Optional[bool] = None
    reconciled_date: Optional[datetime] = None
    related_invoice_id: Optional[str] = None
    related_purchase_order_id: Optional[str] = None
    related_expense_id: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class BankTransaction(BankTransactionBase):
    id: str
    tenant_id: str
    transaction_number: str
    created_by: str
    approved_by: Optional[str] = None
    reconciled_by: Optional[str] = None
    ledger_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'tenant_id', 'created_by', 'approved_by', 'reconciled_by', 'ledger_transaction_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# Online Transaction Models
class OnlineTransactionBase(BaseModel):
    bank_account_id: str
    online_transaction_id: str
    platform: str
    gateway: Optional[str] = None
    transaction_type: str
    amount: float
    currency: str = "USD"
    processing_fee: float = 0.0
    net_amount: float
    status: str
    processing_status: Optional[str] = None
    settlement_date: Optional[datetime] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    payment_method: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None
    description: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    webhook_data: Optional[Dict[str, Any]] = None

class OnlineTransactionCreate(OnlineTransactionBase):
    pass

class OnlineTransactionUpdate(BaseModel):
    platform: Optional[str] = None
    gateway: Optional[str] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    processing_fee: Optional[float] = None
    net_amount: Optional[float] = None
    status: Optional[str] = None
    processing_status: Optional[str] = None
    settlement_date: Optional[datetime] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    payment_method: Optional[str] = None
    card_last_four: Optional[str] = None
    card_brand: Optional[str] = None
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None
    description: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    webhook_data: Optional[Dict[str, Any]] = None

class OnlineTransaction(OnlineTransactionBase):
    id: str
    tenant_id: str
    bank_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'tenant_id', 'bank_transaction_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# Cash Position Models
class CashPositionBase(BaseModel):
    position_date: datetime
    total_bank_balance: float = 0.0
    total_available_balance: float = 0.0
    total_pending_balance: float = 0.0
    total_transactions: int = 0
    online_transactions_count: int = 0
    pending_transactions_count: int = 0
    daily_inflow: float = 0.0
    daily_outflow: float = 0.0
    net_cash_flow: float = 0.0
    outstanding_receivables: float = 0.0
    outstanding_payables: float = 0.0

class CashPositionCreate(CashPositionBase):
    pass

class CashPositionUpdate(BaseModel):
    position_date: Optional[datetime] = None
    total_bank_balance: Optional[float] = None
    total_available_balance: Optional[float] = None
    total_pending_balance: Optional[float] = None
    total_transactions: Optional[int] = None
    online_transactions_count: Optional[int] = None
    pending_transactions_count: Optional[int] = None
    daily_inflow: Optional[float] = None
    daily_outflow: Optional[float] = None
    net_cash_flow: Optional[float] = None
    outstanding_receivables: Optional[float] = None
    outstanding_payables: Optional[float] = None

class CashPosition(CashPositionBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'tenant_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# Response Models
class BankAccountResponse(BaseModel):
    bank_account: BankAccount

class BankAccountsResponse(BaseModel):
    bank_accounts: List[BankAccount]
    total: int

class BankTransactionResponse(BaseModel):
    bank_transaction: BankTransaction

class BankTransactionsResponse(BaseModel):
    bank_transactions: List[BankTransaction]
    total: int

class OnlineTransactionResponse(BaseModel):
    online_transaction: OnlineTransaction

class OnlineTransactionsResponse(BaseModel):
    online_transactions: List[OnlineTransaction]
    total: int

class CashPositionResponse(BaseModel):
    cash_position: CashPosition

class CashPositionsResponse(BaseModel):
    cash_positions: List[CashPosition]
    total: int

# Dashboard Models
class BankingDashboard(BaseModel):
    total_bank_balance: float
    total_available_balance: float
    total_pending_balance: float
    total_online_transactions: int
    pending_transactions_count: int
    daily_inflow: float
    daily_outflow: float
    net_cash_flow: float
    outstanding_receivables: float
    outstanding_payables: float
    recent_transactions: List[BankTransaction]
    bank_accounts_summary: List[Dict[str, Any]]

# Reconciliation Models
class ReconciliationSummary(BaseModel):
    total_transactions: int
    reconciled_transactions: int
    unreconciled_transactions: int
    reconciliation_percentage: float
    last_reconciliation_date: Optional[datetime]

class TransactionReconciliation(BaseModel):
    bank_transaction_id: str
    is_reconciled: bool
    reconciled_date: Optional[datetime]
    reconciled_by: Optional[str]
    notes: Optional[str]
